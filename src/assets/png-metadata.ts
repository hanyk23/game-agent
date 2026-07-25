import { inflateSync } from "node:zlib";

export type PngTechnicalMetadata = Readonly<{
  width: number;
  height: number;
  hasTransparency: boolean;
}>;

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

type Header = Readonly<{
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  interlace: number;
}>;

function paeth(left: number, above: number, upperLeft: number): number {
  const prediction = left + above - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const aboveDistance = Math.abs(prediction - above);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
    return left;
  }
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function samplesPerPixel(colorType: number): number {
  switch (colorType) {
    case 0:
      return 1;
    case 2:
      return 3;
    case 3:
      return 1;
    case 4:
      return 2;
    case 6:
      return 4;
    default:
      throw new Error(`unsupported PNG color type: ${colorType}`);
  }
}

function unfilterRows(header: Header, compressed: Buffer): Buffer[] {
  if (header.interlace !== 0) {
    throw new Error("interlaced PNG verification is not supported");
  }

  const samples = samplesPerPixel(header.colorType);
  const rowBytes = Math.ceil((header.width * samples * header.bitDepth) / 8);
  const filterBytesPerPixel = Math.max(
    1,
    Math.ceil((samples * header.bitDepth) / 8),
  );
  const inflated = inflateSync(compressed);
  const expectedLength = (rowBytes + 1) * header.height;
  if (inflated.length !== expectedLength) {
    throw new Error(
      `invalid PNG scanline length: expected ${expectedLength}, received ${inflated.length}`,
    );
  }

  const rows: Buffer[] = [];
  let offset = 0;
  for (let rowIndex = 0; rowIndex < header.height; rowIndex += 1) {
    const filter = inflated[offset];
    offset += 1;
    const encoded = inflated.subarray(offset, offset + rowBytes);
    offset += rowBytes;
    const decoded = Buffer.alloc(rowBytes);
    const previous = rows[rowIndex - 1];

    for (let index = 0; index < rowBytes; index += 1) {
      const left =
        index >= filterBytesPerPixel
          ? decoded[index - filterBytesPerPixel]!
          : 0;
      const above = previous?.[index] ?? 0;
      const upperLeft =
        index >= filterBytesPerPixel
          ? (previous?.[index - filterBytesPerPixel] ?? 0)
          : 0;
      let predictor = 0;
      if (filter === 1) {
        predictor = left;
      } else if (filter === 2) {
        predictor = above;
      } else if (filter === 3) {
        predictor = Math.floor((left + above) / 2);
      } else if (filter === 4) {
        predictor = paeth(left, above, upperLeft);
      } else if (filter !== 0) {
        throw new Error(`unsupported PNG row filter: ${filter}`);
      }
      decoded[index] = (encoded[index]! + predictor) & 0xff;
    }
    rows.push(decoded);
  }
  return rows;
}

function indexedPixels(row: Buffer, bitDepth: number, width: number): number[] {
  if (![1, 2, 4, 8].includes(bitDepth)) {
    throw new Error(`unsupported indexed PNG bit depth: ${bitDepth}`);
  }
  const mask = (1 << bitDepth) - 1;
  const indexes: number[] = [];
  for (let pixel = 0; pixel < width; pixel += 1) {
    const bitOffset = pixel * bitDepth;
    const byte = row[Math.floor(bitOffset / 8)]!;
    const shift = 8 - bitDepth - (bitOffset % 8);
    indexes.push((byte >> shift) & mask);
  }
  return indexes;
}

function containsTransparency(
  header: Header,
  rows: readonly Buffer[],
  transparency: Buffer | undefined,
): boolean {
  if (header.colorType === 6 || header.colorType === 4) {
    if (header.bitDepth !== 8) {
      throw new Error("only 8-bit PNG alpha channels are supported");
    }
    const stride = header.colorType === 6 ? 4 : 2;
    const alphaOffset = stride - 1;
    return rows.some((row) => {
      for (let offset = alphaOffset; offset < row.length; offset += stride) {
        if (row[offset]! < 255) {
          return true;
        }
      }
      return false;
    });
  }

  if (header.colorType === 3 && transparency !== undefined) {
    return rows.some((row) =>
      indexedPixels(row, header.bitDepth, header.width).some(
        (index) => (transparency[index] ?? 255) < 255,
      ),
    );
  }

  if (transparency === undefined || header.bitDepth !== 8) {
    return false;
  }
  if (header.colorType === 0 && transparency.length >= 2) {
    const transparentValue = transparency.readUInt16BE(0) & 0xff;
    return rows.some((row) => row.includes(transparentValue));
  }
  if (header.colorType === 2 && transparency.length >= 6) {
    const transparent = [
      transparency.readUInt16BE(0) & 0xff,
      transparency.readUInt16BE(2) & 0xff,
      transparency.readUInt16BE(4) & 0xff,
    ];
    return rows.some((row) => {
      for (let offset = 0; offset < row.length; offset += 3) {
        if (
          row[offset] === transparent[0] &&
          row[offset + 1] === transparent[1] &&
          row[offset + 2] === transparent[2]
        ) {
          return true;
        }
      }
      return false;
    });
  }
  return false;
}

export function readPngTechnicalMetadata(buffer: Buffer): PngTechnicalMetadata {
  if (
    buffer.length < PNG_SIGNATURE.length ||
    !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
  ) {
    throw new Error("invalid PNG signature");
  }

  let offset = PNG_SIGNATURE.length;
  let header: Header | undefined;
  let transparency: Buffer | undefined;
  const imageData: Buffer[] = [];
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    if (chunkEnd > buffer.length) {
      throw new Error(`truncated PNG chunk: ${type}`);
    }
    const data = buffer.subarray(dataStart, dataEnd);
    if (type === "IHDR") {
      if (length !== 13 || header !== undefined) {
        throw new Error("invalid PNG IHDR chunk");
      }
      const parsedHeader: Header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8]!,
        colorType: data[9]!,
        interlace: data[12]!,
      };
      if (parsedHeader.width < 1 || parsedHeader.height < 1) {
        throw new Error("PNG dimensions must be positive");
      }
      header = parsedHeader;
    } else if (type === "tRNS") {
      transparency = Buffer.from(data);
    } else if (type === "IDAT") {
      imageData.push(Buffer.from(data));
    } else if (type === "IEND") {
      break;
    }
    offset = chunkEnd;
  }

  if (header === undefined || imageData.length === 0) {
    throw new Error("PNG is missing IHDR or IDAT data");
  }
  const rows = unfilterRows(header, Buffer.concat(imageData));
  return {
    width: header.width,
    height: header.height,
    hasTransparency: containsTransparency(header, rows, transparency),
  };
}
