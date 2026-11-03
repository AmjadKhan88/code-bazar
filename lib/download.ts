import crypto from "node:crypto";

function getSigningSecret(): string {
  return (
    process.env.DOWNLOAD_SIGNING_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "codebazaar-dev-signing-secret"
  );
}

export function signDownloadParams(
  licenseId: string,
  productId: string,
  ttlSeconds = 900
): { exp: number; sig: string } {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${licenseId}:${productId}:${exp}`;
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("hex");
  return { exp, sig };
}

export function verifyDownloadParams(
  licenseId: string,
  productId: string,
  exp: number,
  sig: string
): boolean {
  if (!licenseId || !productId || !exp || !sig) return false;
  if (Math.floor(Date.now() / 1000) > exp) return false;

  const payload = `${licenseId}:${productId}:${exp}`;
  const expected = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("hex");

  const sigBuf = Buffer.from(sig, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

export function buildSignedDownloadUrl(
  licenseId: string,
  productId: string,
  ttlSeconds = 900
): string {
  const { exp, sig } = signDownloadParams(licenseId, productId, ttlSeconds);
  const params = new URLSearchParams({
    licenseId,
    productId,
    exp: String(exp),
    sig,
  });
  return `/api/download?${params.toString()}`;
}
