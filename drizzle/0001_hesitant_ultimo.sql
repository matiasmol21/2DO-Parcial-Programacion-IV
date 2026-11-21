ALTER TABLE `facturas` ADD `anulado_por_id` integer REFERENCES usuarios(id);--> statement-breakpoint
ALTER TABLE `facturas` ADD `anulado_en` text;--> statement-breakpoint
ALTER TABLE `movimientos_stock` ADD `observacion` text;