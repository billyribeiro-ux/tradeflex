type Level = 'debug' | 'info' | 'warn' | 'error';

interface LogFields {
	requestId?: string;
	userId?: string | null;
	impersonatorUserId?: string | null;
	method?: string;
	path?: string;
	status?: number;
	latencyMs?: number;
	error?: { name: string; message: string; stack?: string };
	[k: string]: unknown;
}

function write(level: Level, msg: string, fields: LogFields = {}) {
	const line = { level, msg, at: new Date().toISOString(), ...fields };
	const json = JSON.stringify(line);
	if (level === 'error') console.error(json);
	else if (level === 'warn') console.warn(json);
	else console.log(json);
}

export const log = {
	debug: (msg: string, fields?: LogFields) => write('debug', msg, fields),
	info: (msg: string, fields?: LogFields) => write('info', msg, fields),
	warn: (msg: string, fields?: LogFields) => write('warn', msg, fields),
	error: (msg: string, fields?: LogFields) => write('error', msg, fields)
};

export function reportError(err: unknown, fields?: LogFields) {
	const e = err instanceof Error ? err : new Error(String(err));
	log.error(e.message, {
		...fields,
		error: { name: e.name, message: e.message, stack: e.stack }
	});
}
