import fs from 'node:fs';
import path from 'node:path';
import { SecretRedactor } from '../security/security-guard.js';

const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.pdf',
  '.sqlite',
  '.sqlite3',
  '.db',
  '.zip',
  '.woff',
  '.woff2',
  '.exe',
  '.dll',
  '.node',
]);

const DEPRECATED_GEMINI_MODEL_REGEX = new RegExp('gemini-' + '2\\.5', 'i');

function walkRepoFiles(dir: string, out: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name === 'node_modules' ||
      entry.name === '.git' ||
      entry.name === 'dist' ||
      entry.name === '.runtime'
    ) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkRepoFiles(full, out);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!BINARY_EXTENSIONS.has(ext)) {
        out.push(full);
      }
    }
  }
  return out;
}

function main(): void {
  console.log('=============================================================');
  console.log(' THYRENIA ENGINE - AUDITORÍA DE CIBERSEGURIDAD (ADR-0011)');
  console.log('=============================================================\n');

  const rootDir = process.cwd();
  const issues: string[] = [];

  // 1. Verificar que .gitignore protege .env y bases de datos locales
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    issues.push('Falta archivo .gitignore en la raíz del proyecto.');
  } else {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    if (!gitignoreContent.includes('.env')) {
      issues.push('.gitignore no incluye protección para archivos .env');
    }
    if (!gitignoreContent.includes('*.sqlite')) {
      issues.push('.gitignore no incluye protección para bases de datos *.sqlite');
    }
    if (!gitignoreContent.includes('.runtime/')) {
      issues.push('.gitignore no incluye protección para el directorio .runtime/');
    }
  }

  const privateKeyRegex = new RegExp(
    '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
  );

  // 2. Escanear archivos de texto y fixtures en busca de claves AIza..., ?key= y modelos deprecados
  const allFiles = walkRepoFiles(rootDir);
  for (const file of allFiles) {
    const rel = path.relative(rootDir, file).replace(/\\/g, '/');
    if (rel === '.env' || rel === '.env.local') {
      continue;
    }

    const content = fs.readFileSync(file, 'utf-8');
    if (SecretRedactor.containsUnredactedKey(content)) {
      issues.push(`Clave de API de Google expuesta detectada en: ${rel}`);
    }

    if (
      rel !== 'src/cli/security-audit.ts' &&
      privateKeyRegex.test(content)
    ) {
      issues.push(`Posible clave privada PEM detectada en: ${rel}`);
    }

    if (
      rel.startsWith('src/') &&
      rel !== 'src/security/security-guard.ts' &&
      /https:\/\/generativelanguage\.googleapis\.com[^\s"']*\?key=/i.test(
        content,
      )
    ) {
      issues.push(
        `Uso inseguro de ?key= en URL de Google AI Studio detectado en: ${rel} (debe usar cabecera x-goog-api-key)`,
      );
    }

    if (
      (rel.startsWith('src/') ||
        rel.startsWith('test/fixtures/') ||
        rel === '.env.example') &&
      DEPRECATED_GEMINI_MODEL_REGEX.test(content)
    ) {
      issues.push(
        `Identificador de modelo deprecado (serie 2.5) detectado en: ${rel}`,
      );
    }
  }

  // 3. Verificar protección de supply-chain en package.json (pnpm.onlyBuiltDependencies)
  const pkgPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (!pkg.pnpm?.onlyBuiltDependencies) {
      issues.push(
        'package.json no define pnpm.onlyBuiltDependencies para restringir scripts postinstall.',
      );
    }
  }

  if (issues.length > 0) {
    console.error('FALLO EN AUDITORÍA DE SEGURIDAD:');
    for (const issue of issues) {
      console.error(`  [X] ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('  [OK] .gitignore bloquea archivos .env y bases de datos locales.');
  console.log(
    `  [OK] ${allFiles.length} archivos y fixtures escaneados: 0 claves AIza... expuestas.`,
  );
  console.log(
    '  [OK] 0 llamadas HTTP con credenciales en query params (?key=).',
  );
  console.log(
    '  [OK] 0 configuraciones o fixtures con modelos deprecados (serie 2.5).',
  );
  console.log(
    '  [OK] Supply-chain protegida mediante pnpm.onlyBuiltDependencies.',
  );
  console.log('\nResultado: AUDITORÍA DE CIBERSEGURIDAD SUPERADA CON ÉXITO.');
}

main();
