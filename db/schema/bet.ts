import { boolean, index, integer, numeric, pgEnum, pgTable, text, timestamp, unique, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import { defaultFields } from './default'

export const BetPrediction = pgEnum('bet_prediction', ['odd', 'even'])
export const BetSettleStatus = pgEnum('bet_settle_status', ['pending', 'success', 'error'])
export const BetToken = pgEnum('bet_token', ['SOL', 'MUSHU'])
export const WagerSettleStatus = pgEnum('wager_settle_status', ['pending', 'success', 'error'])

export const bets = pgTable('bets', {
  ...defaultFields,
  // 开始时间
  startedAt: timestamp('started_at', { mode: 'date', precision: 3, withTimezone: true })
    .notNull(),
  // 实际结束时间
  closedAt: timestamp('closed_at', { mode: 'date', precision: 3, withTimezone: true }),
  // 原定开奖时间
  scheduledDrawingAt: timestamp('scheduled_drawing_at', { mode: 'date', precision: 3, withTimezone: true }).notNull().defaultNow(),
  // 结果
  result: BetPrediction('result'),
  status: BetSettleStatus('status').notNull().default('pending'),
  wagerLoaded: boolean('wager_loaded').notNull().default(false),
  // 事务中，先创建此条记录，然后用id去创建资金账户
  fundingAccount: varchar('funding_account'),
  //
  settlementSignature: varchar('settle_signature'),
  settlementError: text('settle_error'),
})

export const betsRelations = relations(bets, ({ many }) => ({
  wagers: many(wagers),
}))

export const wagers = pgTable('wagers', {
  ...defaultFields,
  betId: integer('bet_id').references(() => bets.id, {
    onDelete: 'cascade',
  }).notNull(),
  userAddress: varchar('user_address').notNull(),
  prediction: BetPrediction('prediction').notNull(),
  // 赌注
  amount: numeric('amount', { precision: 40, scale: 0 }).notNull(),
  token: BetToken('token').notNull(),
  blockNumber: integer('block_number').notNull(),
  // 参加赌局的signature
  signature: varchar('signature').notNull(),
  status: WagerSettleStatus('status').notNull().default('pending'),
  profit: numeric('profit', { precision: 40, scale: 0 }),
  // 发送代币的signature
  profitSignature: varchar('profit_signature'),
  settlementError: text('settlement_error'),
}, t => ({
  transactionUnique: unique().on(t.signature, t.betId, t.userAddress),
  betIdIndex: index('bet_id_index').on(t.betId),
  userAddressIndex: index('user_addr_index').on(t.userAddress),
}))

export const wagersRelations = relations(wagers, ({ one }) => ({
  bet: one(bets),
}))

export type Bet = typeof bets.$inferSelect
export type Wager = typeof wagers.$inferSelect
export const insertBetSchema = createInsertSchema(bets)
