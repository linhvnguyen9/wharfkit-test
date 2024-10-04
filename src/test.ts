import zlib from 'zlib';

(async () => {
    const base64String = "gmMsfmIRpc7x7DpLh8nvg-zz9VdvrLYRihbJ-mIxXW5CYY4vEwMKYASTrwxCQZRH8V47RoGZc7L8uNZnggRWvDUyUoAJwGl1iFYWV_9gMIPJOqOkpKDYSl8_OUkvMS85I79ILyczL1vfxCTFNNXcIFHXPDnZVNfE3DxJ18IsyUzX0tQg0dIixcjQNC2FkQWk9CTIHVcYeTJtGJg1l6jOW5nmccjHufDzJtMDKdfXCIg9W7UrRm9n2uHJ9bLGcxkdwXb4gKww1jPTM1BwKsovL04tCilKzCsuyC8qgQr75ldl5uQk6psC2Rq-icmZeSX5xRnWCp55Jak5CkABBf9ghQgFQ4N4Q9N4c00Fx4KCnNTw1CTvzBJ9U2NzPWMzBQ1vjxBfHx2FnMzsVAX31OTsfE0F54yi_NxUfUMjcz0DEFQITkxLLMqEagEA"; // "Hello world" encoded in Base64
    const byteArray = Buffer.from(base64String, 'base64')
    console.log(byteArray);

    const header = byteArray[0] // Header bytes denoting version and whether data is compressed
    const payload = byteArray.slice(1)

    // console.log(header);
    console.log(payload);
    const uncompressed = zlib.inflateRawSync(payload)
    // console.log(uncompressed);

    const testString = "Hello world";
    const compressedRaw = zlib.deflateRawSync(testString);
    const compressed = zlib.deflateSync(testString);
    console.log(compressedRaw.toString());
    console.log(compressed.toString());

    const zlibHeader = Buffer.from([0x78, 0x9C]);
    const adler32 = calculateAdler32(compressed);
    const testUncompressed = zlib.inflateSync(Buffer.concat([zlibHeader, compressed, adler32]))
    console.log(testUncompressed.toString('base64'));
})();

function calculateAdler32(data: Buffer): Buffer {
    const MOD_ADLER = 65521;
    let a = 1, b = 0;
  
    for (let i = 0; i < data.length; i++) {
      a = (a + data[i]) % MOD_ADLER;
      b = (b + a) % MOD_ADLER;
    }
  
    // Convert the 32-bit checksum into a 4-byte buffer
    const checksum = (b << 16) | a;
    const checksumBuffer = Buffer.alloc(4);
    checksumBuffer.writeUInt32BE(checksum, 0);
  
    return checksumBuffer;
  }