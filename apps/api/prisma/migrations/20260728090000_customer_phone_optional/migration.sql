-- Email+OTP auth: mijoz telefonisiz ro'yxatdan o'tadi — phone ixtiyoriy.
ALTER TABLE "customers" ALTER COLUMN "phone" DROP NOT NULL;
