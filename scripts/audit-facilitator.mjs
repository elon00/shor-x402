async function audit() {
  const res = await fetch('https://x402.goplausible.xyz/');
  const html = await res.text();
  const links = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  console.log('Unique Links on x402.goplausible.xyz:');
  console.log([...new Set(links)]);
}

audit().catch(console.error);
