const version = process.env.npm_package_version || '0.1.0';
const requestedTargets = process.argv.slice(2);
const defaultTarget =
  process.platform === 'darwin' && process.arch === 'arm64'
    ? 'bun-darwin-arm64'
    : process.platform === 'darwin' && process.arch === 'x64'
      ? 'bun-darwin-x64'
      : process.platform === 'linux' && process.arch === 'x64'
        ? 'bun-linux-x64'
        : process.platform === 'win32' && process.arch === 'x64'
          ? 'bun-windows-x64'
          : null;

if (!defaultTarget && requestedTargets.length === 0) {
  throw new Error(`Unsupported local platform: ${process.platform}-${process.arch}`);
}

const targets = requestedTargets.length > 0 ? requestedTargets : [defaultTarget!];

for (const target of targets) {
  const outdir = `release/${target}`;
  const outfile = target.startsWith('bun-windows') ? `${outdir}/paperbd.exe` : `${outdir}/paperbd`;

  await Bun.build({
    entrypoints: ['./src/index.tsx'],
    target: 'bun',
    minify: true,
    sourcemap: 'none',
    compile: {
      target,
      outfile,
    },
    define: {
      'process.env.PAPERBD_BASE_URL': JSON.stringify('https://paperbreakdown.com'),
    },
  });

  await Bun.write(
    `${outdir}/BUILD_INFO.txt`,
    `paperbd-cli ${version}\ncompiled target: ${target}\nbase url: https://paperbreakdown.com\n`
  );
}

console.log(`Built ${targets.length} target${targets.length === 1 ? '' : 's'} into release/`);
