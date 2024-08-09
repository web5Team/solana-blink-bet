import { eq } from 'drizzle-orm'
import db from '..'
import { dictionary } from '../schema'

export async function insertDictionaryValue<T>(key: string, value: T, upsert: boolean = false) {
  const op = db.insert(dictionary).values({ key, value })
  if (upsert) {
    await op.onConflictDoUpdate({
      target: dictionary.key,
      set: {
        value,
      },
    })
  }
  else {
    await op
  }
  return value
}

export async function getDictionaryValue<T>(key: string) {
  const result = await db
    .select().from(dictionary)
    .where(eq(dictionary.key, key))
    .limit(1)
  return result.at(0)?.value as T | undefined
}

export async function deleteDictionaryValue(key: string) {
  return await db.delete(dictionary).where(eq(dictionary.key, key))
}
