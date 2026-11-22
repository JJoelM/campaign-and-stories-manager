import crypto from 'node:crypto';
import path from 'node:path';

/**
 * Comparación en tiempo constante mediante hash SHA-256 para evitar ataques de temporización sobre claves GM.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(String(a), 'utf-8').digest();
  const hashB = crypto.createHash('sha256').update(String(b), 'utf-8').digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Redacta claves de API de Google (AIza...), tokens Bearer, query params ?key=...
 * y cualquier secreto explícito antes de guardar fixtures o imprimir logs (ADR-0011).
 */
export class SecretRedactor {
  private static readonly GOOGLE_API_KEY_REGEX = /AIza[0-9A-Za-z\-_]{35}/g;
  private static readonly URL_KEY_PARAM_REGEX = /([?&]key=)[^&\s"']+/gi;
  private static readonly BEARER_TOKEN_REGEX = /(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi;
  private static readonly HEADER_KEY_REGEX =
    /(["']?x-goog-api-key["']?\s*[:=]\s*["']?)[^"'\s,}]+/gi;

  static redact(input: string, explicitSecrets: string[] = []): string {
    let sanitized = input
      .replace(this.GOOGLE_API_KEY_REGEX, '[REDACTED_API_KEY]')
      .replace(this.URL_KEY_PARAM_REGEX, '$1[REDACTED_API_KEY]')
      .replace(this.BEARER_TOKEN_REGEX, '$1[REDACTED_TOKEN]')
      .replace(this.HEADER_KEY_REGEX, '$1[REDACTED_API_KEY]');

    const envKey = process.env.GEMINI_API_KEY;
    const allSecrets = [
      ...explicitSecrets,
      ...(envKey && envKey !== 'TU_CLAVE_AQUI' && envKey.length >= 8
        ? [envKey]
        : []),
    ];

    for (const secret of allSecrets) {
      if (secret && secret.trim().length > 0) {
        sanitized = sanitized.split(secret).join('[REDACTED_API_KEY]');
      }
    }

    return sanitized;
  }

  static containsUnredactedKey(input: string): boolean {
    this.GOOGLE_API_KEY_REGEX.lastIndex = 0;
    return this.GOOGLE_API_KEY_REGEX.test(input);
  }
}

/**
 * Previene ataques de Path Traversal o escritura en directorios prohibidos (.obsidian, .agents, .git, .scratch)
 * cuando el DM aprueba una Propuesta de Canon generada por el LLM (ADR-0004, ADR-0011).
 */
export class SafeVaultPathGuard {
  private static readonly FORBIDDEN_SEGMENTS = new Set([
    '.obsidian',
    '.agents',
    '.agent',
    '.git',
    '.github',
    '.scratch',
    'node_modules',
  ]);

  static sanitizeFileName(rawTitle: string): string {
    const cleaned = rawTitle
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/\.\.+/g, '.')
      .trim();

    if (!cleaned || cleaned === '.' || cleaned === '..') {
      throw new Error(`Nombre de archivo inválido para el Vault: "${rawTitle}"`);
    }

    return cleaned.endsWith('.md') ? cleaned : `${cleaned}.md`;
  }

  static resolveSafeWritePath(
    vaultRootPath: string,
    targetSubfolder: string,
    rawFileName: string,
  ): string {
    const resolvedRoot = path.resolve(vaultRootPath);

    if (path.isAbsolute(targetSubfolder)) {
      throw new Error(
        `Violación de seguridad (Path Traversal): targetSubfolder no puede ser una ruta absoluta ("${targetSubfolder}")`,
      );
    }

    const safeFileName = this.sanitizeFileName(rawFileName);
    const candidatePath = path.resolve(
      resolvedRoot,
      targetSubfolder,
      safeFileName,
    );
    const relativeToRoot = path.relative(resolvedRoot, candidatePath);

    if (
      relativeToRoot.startsWith('..') ||
      path.isAbsolute(relativeToRoot) ||
      relativeToRoot === ''
    ) {
      throw new Error(
        `Violación de seguridad (Path Traversal): La ruta "${candidatePath}" escapa del Vault Maestro ("${resolvedRoot}")`,
      );
    }

    const segments = relativeToRoot.split(/[\\/]/);
    for (const segment of segments) {
      if (
        this.FORBIDDEN_SEGMENTS.has(segment.toLowerCase()) ||
        segment.startsWith('.')
      ) {
        throw new Error(
          `Violación de seguridad: Escritura prohibida en directorio oculto o de sistema ("${segment}")`,
        );
      }
    }

    return candidatePath;
  }

  private static readonly MEDIA_MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };

  static getMediaMimeType(fileName: string): string | undefined {
    const ext = path.extname(fileName).toLowerCase();
    return this.MEDIA_MIME_TYPES[ext];
  }

  private static readonly RASTER_UPLOAD_MIMES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };

  /**
   * Valida y normaliza un nombre de imagen subido por jugadores permitiendo
   * únicamente formatos raster seguros (.png, .jpg, .jpeg, .webp, .gif).
   */
  static sanitizeMediaFileName(rawFileName: string): {
    fileName: string;
    mimeType: string;
  } {
    const trimmed = rawFileName.trim();
    if (
      !trimmed ||
      trimmed.includes('..') ||
      trimmed.includes('/') ||
      trimmed.includes('\\') ||
      trimmed.startsWith('.')
    ) {
      throw new Error(
        `Violación de seguridad (Path Traversal): nombre de imagen inválido ("${rawFileName}")`,
      );
    }

    const ext = path.extname(trimmed).toLowerCase();
    const mimeType = this.RASTER_UPLOAD_MIMES[ext];
    if (!mimeType) {
      throw new Error(
        `Extensión de imagen no permitida ("${ext || 'sin extensión'}"). Usa .png, .jpg, .jpeg, .webp o .gif.`,
      );
    }

    const rawStem = path.basename(trimmed, path.extname(trimmed));
    const safeStem = rawStem
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64);

    if (!safeStem) {
      throw new Error('Nombre de imagen inválido tras sanitización.');
    }

    return {
      fileName: `${safeStem}${ext}`,
      mimeType,
    };
  }

  /**
   * Verifica la firma binaria real (magic bytes) de una imagen subida.
   */
  static validateImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
    if (mimeType === 'image/png') {
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    }
    if (mimeType === 'image/jpeg') {
      return (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      );
    }
    if (mimeType === 'image/gif') {
      return (
        buffer.length >= 6 &&
        buffer.subarray(0, 4).toString('ascii') === 'GIF8'
      );
    }
    if (mimeType === 'image/webp') {
      return (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      );
    }
    return false;
  }

  /**
   * Resuelve de forma segura una ruta de imagen dentro de `<vaultRoot>/images/`
   * bloqueando cualquier intento de Path Traversal, subdirectorios ocultos o archivos no gráficos.
   */
  static resolveSafeMediaReadPath(
    vaultRootPath: string,
    rawFileName: string,
  ): { filePath: string; fileName: string; mimeType: string } {
    const trimmed = rawFileName.trim();
    if (
      !trimmed ||
      trimmed.includes('..') ||
      trimmed.includes('/') ||
      trimmed.includes('\\') ||
      trimmed.startsWith('.')
    ) {
      throw new Error(
        `Violación de seguridad (Path Traversal): nombre de archivo multimedia no permitido ("${rawFileName}")`,
      );
    }

    const mimeType = this.getMediaMimeType(trimmed);
    if (!mimeType) {
      throw new Error(
        `Extensión de archivo multimedia no permitida para "${trimmed}"`,
      );
    }

    const resolvedVault = path.resolve(vaultRootPath);
    const imagesDir = path.resolve(resolvedVault, 'images');
    const candidatePath = path.resolve(imagesDir, trimmed);
    const relToImages = path.relative(imagesDir, candidatePath);

    if (
      !relToImages ||
      relToImages.startsWith('..') ||
      path.isAbsolute(relToImages) ||
      relToImages.includes(path.sep)
    ) {
      throw new Error(
        `Violación de seguridad (Path Traversal): "${trimmed}" escapa del directorio images/`,
      );
    }

    return {
      filePath: candidatePath,
      fileName: trimmed,
      mimeType,
    };
  }
}

export interface SanitizedPlayerInput {
  wrappedPromptBlock: string;
  cleanText: string;
  wasTruncated: boolean;
  suspiciousInjectionPatterns: string[];
}

/**
 * Sanitiza entradas de texto libre de los jugadores y las encapsula en delimitadores
 * de baja confianza para mitigar Prompt Injection (ADR-0011).
 */
export class InputSanitizer {
  private static readonly INJECTION_PATTERNS: Array<{
    name: string;
    regex: RegExp;
  }> = [
    {
      name: 'ignore_previous_instructions',
      regex:
        /ignora\s+(todas\s+)?las\s+instrucciones|ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    },
    {
      name: 'system_prompt_exfiltration',
      regex:
        /system\s+prompt|instrucciones\s+del\s+sistema|GEMINI_API_KEY|x-goog-api-key|dm_only|%%.*%%/i,
    },
    {
      name: 'xml_delimiter_escape',
      regex: /<\/?untrusted_player_action>/i,
    },
  ];

  static sanitize(
    rawAction: string,
    maxChars = Number(process.env.MAX_PLAYER_INPUT_CHARS || 1000),
  ): SanitizedPlayerInput {
    const suspiciousInjectionPatterns: string[] = [];

    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.regex.test(rawAction)) {
        suspiciousInjectionPatterns.push(pattern.name);
      }
    }

    // Eliminar caracteres de control ASCII no imprimibles (excepto saltos de línea y tabs normales)
    let cleanText = rawAction
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/<\/?untrusted_player_action>/gi, '[TAG_STRIPPED]')
      .trim();

    let wasTruncated = false;
    if (cleanText.length > maxChars) {
      cleanText = cleanText.slice(0, maxChars);
      wasTruncated = true;
    }

    const wrappedPromptBlock = `<untrusted_player_action>\n${cleanText}\n</untrusted_player_action>`;

    return {
      wrappedPromptBlock,
      cleanText,
      wasTruncated,
      suspiciousInjectionPatterns,
    };
  }
}

export interface TokenBudgetStatus {
  estimatedInputTokens: number;
  maxOutputTokens: number;
  projectedTurnTokens: number;
  sessionConsumedTokens: number;
  remainingSessionTokens: number;
}

/**
 * Controlador de presupuesto de tokens por turno y acumulado por sesión (ADR-0011).
 * Previene prompts desbordados y consumo excesivo de cuota en Google AI Studio.
 */
export class TokenBudgetGuard {
  private consumedSessionTokens = 0;

  constructor(
    private readonly maxInputTokensPerTurn = Number(
      process.env.MAX_INPUT_TOKENS_PER_TURN || 120_000,
    ),
    private readonly maxOutputTokensPerTurn = Number(
      process.env.MAX_OUTPUT_TOKENS || 2048,
    ),
    private readonly maxSessionTokens = Number(
      process.env.MAX_SESSION_TOKENS || 500_000,
    ),
  ) {}

  static estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  assertTurnBudget(
    inputText: string,
    requestedMaxOutputTokens: number,
  ): TokenBudgetStatus {
    const estimatedInputTokens = TokenBudgetGuard.estimateTokens(inputText);

    if (estimatedInputTokens > this.maxInputTokensPerTurn) {
      throw new Error(
        `Presupuesto de entrada excedido (TokenBudgetGuard): ${estimatedInputTokens} tokens estimados supera el límite de ${this.maxInputTokensPerTurn} por turno.`,
      );
    }

    if (requestedMaxOutputTokens > this.maxOutputTokensPerTurn) {
      throw new Error(
        `Presupuesto de salida excedido (TokenBudgetGuard): ${requestedMaxOutputTokens} tokens supera el límite de ${this.maxOutputTokensPerTurn} por turno.`,
      );
    }

    const projectedTurnTokens = estimatedInputTokens + requestedMaxOutputTokens;
    if (this.consumedSessionTokens + projectedTurnTokens > this.maxSessionTokens) {
      throw new Error(
        `Presupuesto acumulado de sesión excedido (TokenBudgetGuard): consumo actual (${this.consumedSessionTokens}) + turno proyectado (${projectedTurnTokens}) supera el límite de ${this.maxSessionTokens} tokens.`,
      );
    }

    return {
      estimatedInputTokens,
      maxOutputTokens: requestedMaxOutputTokens,
      projectedTurnTokens,
      sessionConsumedTokens: this.consumedSessionTokens,
      remainingSessionTokens:
        this.maxSessionTokens - this.consumedSessionTokens - projectedTurnTokens,
    };
  }

  recordUsage(inputTokens: number, outputTokens: number): number {
    const delta = Math.max(0, Math.trunc(inputTokens)) + Math.max(0, Math.trunc(outputTokens));
    this.consumedSessionTokens += delta;
    return this.consumedSessionTokens;
  }

  getConsumedTokens(): number {
    return this.consumedSessionTokens;
  }
}

/**
 * Limitador de frecuencia en ventana deslizante para proteger la cuota de Google AI Studio.
 */
export class RateLimiter {
  private timestamps: number[] = [];

  constructor(
    private readonly maxRequestsPerWindow = Number(
      process.env.MAX_REQUESTS_PER_MINUTE || 20,
    ),
    private readonly windowMs = 60_000,
  ) {}

  checkAndRecord(nowMs = Date.now()): void {
    this.timestamps = this.timestamps.filter((ts) => nowMs - ts < this.windowMs);
    if (this.timestamps.length >= this.maxRequestsPerWindow) {
      throw new Error(
        `Límite de cuota excedido (RateLimiter): Máximo ${this.maxRequestsPerWindow} peticiones por ${this.windowMs / 1000}s.`,
      );
    }
    this.timestamps.push(nowMs);
  }
}
