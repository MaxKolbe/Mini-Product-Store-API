ALTER TABLE "order" RENAME TO "orders";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "order_stripe_checkout_session_id_unique";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "order_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "order_item" DROP CONSTRAINT "order_item_order_id_order_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id");