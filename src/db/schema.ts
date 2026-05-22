import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const packageStatusEnum = pgEnum('package_status', [
  'received_usa',
  'in_transit',
  'in_customs',
  'ready_pickup',
  'delivered',
])

export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  trackingNumber: varchar('tracking_number', { length: 100 }).notNull().unique(),
  description: text('description'),
  status: packageStatusEnum('status').notNull().default('received_usa'),
  customerName: varchar('customer_name', { length: 200 }).notNull(),
  whatsappNumber: varchar('whatsapp_number', { length: 20 }),
  clerkUserId: varchar('clerk_user_id', { length: 200 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const statusHistory = pgTable('status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id')
    .notNull()
    .references(() => packages.id, { onDelete: 'cascade' }),
  status: packageStatusEnum('status').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
