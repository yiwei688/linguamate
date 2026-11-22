// 数据库：一个文件就是整个库，不装服务、不开端口、不要密码。
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { randomBytes, scryptSync } from 'node:crypto'

const DATA_DIR = join(process.cwd(), 'data')
mkdirSync(DATA_DIR, { recursive: true })

export const db = new DatabaseSync(join(DATA_DIR, 'app.db'))

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    account    TEXT    NOT NULL UNIQUE,
    pass_hash  TEXT    NOT NULL,
    pass_salt  TEXT    NOT NULL,
    phone      TEXT    NOT NULL,
    email      TEXT    NOT NULL,
    level      TEXT    NOT NULL DEFAULT 'B1',
    tags       TEXT    NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS partners (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL,
    level TEXT NOT NULL,
    tags  TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS practices (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_account  TEXT    NOT NULL,
    partner_name  TEXT    NOT NULL,
    minutes       INTEGER NOT NULL,
    created_at    INTEGER NOT NULL
  );
`)

/** 密码不存明文：加盐后用 scrypt 搅碎 */
export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  return { salt, hash: scryptSync(password, salt, 64).toString('hex') }
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  return scryptSync(password, salt, 64).toString('hex') === hash
}

const NAMES = ['Mia', 'Leo', 'Sara', 'Ken', 'Ivy', 'Noah', 'Zoe', 'Tom', 'Lily', 'Owen',
  'Emma', 'Ryan', 'Nina', 'Jack', 'Ava', 'Ben', 'Chloe', 'Eden', 'Fiona', 'Gabe',
  'Hana', 'Ian', 'Jade', 'Kyle', 'Luna', 'Max', 'Nora', 'Oscar', 'Pia', 'Quinn']
const COLORS = ['#7c6cf6', '#12b3a6', '#ff6b4a', '#f0a91b', '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6', '#d946ef', '#64748b']
const TAGS = ['电影迷', '科技控', '旅行党', '社会派', '音乐虫', '美食家', '游戏党', '读书人']
const SOCIAL = ['破冰者', '慢热型', '倾听者', '深聊派']
const LEVELS = ['A2', 'B1', 'B2']

/** 第一次启动时灌数据：30 个语伴 + 一个 demo 账号 + 20 条练习记录 */
export function seedIfEmpty(): void {
  const row = db.prepare('SELECT COUNT(*) AS c FROM partners').get() as { c: number }
  if (row.c > 0) return

  const insertPartner = db.prepare('INSERT INTO partners (name, level, tags, color) VALUES (?, ?, ?, ?)')
  NAMES.forEach((name, i) => {
    const tags = [TAGS[i % TAGS.length], SOCIAL[(i * 3) % SOCIAL.length]]
    insertPartner.run(name, LEVELS[i % 3], tags.join(','), COLORS[i % COLORS.length])
  })

  const demo = hashPassword('123456')
  db.prepare(
    'INSERT OR IGNORE INTO users (account, pass_hash, pass_salt, phone, email, level, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run('demo', demo.hash, demo.salt, '13800138000', 'demo@example.com', 'B1', '电影迷,慢热型', Date.now())

  const insertPractice = db.prepare(
    'INSERT INTO practices (user_account, partner_name, minutes, created_at) VALUES (?, ?, ?, ?)',
  )
  const day = 24 * 60 * 60 * 1000
  for (let i = 0; i < 20; i++) {
    insertPractice.run('demo', NAMES[i % NAMES.length], 5 + (i % 11), Date.now() - i * day)
  }

  console.log('[db] 首次启动，已灌入 30 个语伴、demo 账号、20 条练习记录')
}
