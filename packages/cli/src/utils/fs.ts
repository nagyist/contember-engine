import { tuple } from './tuple'
import { promises as fs } from 'fs'
import { join } from 'path'

export const listDirectories = async (dir: string): Promise<string[]> => {
	try {
		const entries = (await fs.readdir(dir)).map(it => join(dir, it))
		const stats = await Promise.all(entries.map(async it => tuple(it, await fs.lstat(it))))
		return stats.filter(([, it]) => it.isDirectory()).map(([it]) => it)
	} catch (e) {
		if (e.code && e.code === 'ENOENT') {
			return []
		}
		throw e
	}
}
