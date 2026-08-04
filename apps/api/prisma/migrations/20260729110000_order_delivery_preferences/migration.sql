-- Checkout'da mijoz tanlagan manzil/slot buyurtmada saqlanadi (jo'natma
-- yaratishda ishlatiladi). FK YO'Q — bu snapshot-havola: manzil o'chirilsa
-- ham buyurtma tarixi buzilmaydi (shipment yaratishda qayta tekshiriladi).
ALTER TABLE "orders" ADD COLUMN "delivery_address_id" UUID;
ALTER TABLE "orders" ADD COLUMN "delivery_slot_id" UUID;
