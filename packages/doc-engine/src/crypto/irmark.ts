import crypto from 'node:crypto';

export interface IRmarkResult {
  irmarkBase64: string;
  irmarkBase32: string;
  canonicalBodyXml: string;
}

/**
 * Base32 character set used by HMRC for human-readable IRmark display:
 * 0-9 and A-Z (excluding confusing characters like O, I, etc. per HMRC RFC 4648 variant).
 */
const HMRC_BASE32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i] ?? 0;
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += HMRC_BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += HMRC_BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Removes any pre-existing IRmark element from the XML string per HMRC specification.
 */
export function stripExistingIRmark(xml: string): string {
  return xml.replace(/<IRmark[^>]*>[\s\S]*?<\/IRmark>/gi, '');
}

/**
 * Extracts the `<Body>` node (inclusive of open and close tags) from a GovTalkMessage XML envelope.
 */
export function extractGovTalkBody(govTalkXml: string): string {
  const match = /<Body[\s\S]*?<\/Body>/i.exec(govTalkXml);
  if (!match || !match[0]) {
    throw new Error('GovTalk XML payload missing mandatory <Body> element.');
  }
  return match[0];
}

/**
 * Normalizes XML fragment according to core W3C C14N canonicalization rules:
 * - Line endings normalized to LF (\n)
 * - Self-closing tags expanded to <tag></tag>
 * - Cleaned of unnecessary XML declarations inside body
 */
export function canonicalizeXmlFragment(rawXml: string): string {
  // 1. Remove XML declaration if present
  let normalized = rawXml.replace(/<\?xml[^>]*\?>/gi, '').trim();

  // 2. Normalize all line breaks to \n (0x0A)
  normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 3. Expand self-closing tags <tag/> to <tag></tag> (except empty void elements)
  normalized = normalized.replace(/<([a-zA-Z0-9_:-]+)([^>]*?)\/>/g, '<$1$2></$1>');

  return normalized;
}

/**
 * Generates the official HMRC IRmark from an XML Body fragment.
 * Follows the statutory HMRC specification:
 * 1. Remove any existing IRmark node
 * 2. Canonicalise the body
 * 3. Compute SHA-1 digest
 * 4. Encode as Base64 and Base32
 */
export function computeIRmark(bodyXml: string): IRmarkResult {
  const cleanedBody = stripExistingIRmark(bodyXml);
  const canonicalBodyXml = canonicalizeXmlFragment(cleanedBody);

  const sha1Buffer = crypto.createHash('sha1').update(canonicalBodyXml, 'utf8').digest();

  const irmarkBase64 = sha1Buffer.toString('base64');
  const irmarkBase32 = encodeBase32(sha1Buffer);

  return {
    irmarkBase64,
    irmarkBase32,
    canonicalBodyXml,
  };
}

