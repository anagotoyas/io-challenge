-- CreateTable
CREATE TABLE "card_requests" (
    "request_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "card_type" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "issued_cards" (
    "card_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "card_number" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "cvv" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issued_cards_pkey" PRIMARY KEY ("card_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_requests_document_number_key" ON "card_requests"("document_number");

-- CreateIndex
CREATE UNIQUE INDEX "issued_cards_request_id_key" ON "issued_cards"("request_id");

-- AddForeignKey
ALTER TABLE "issued_cards" ADD CONSTRAINT "issued_cards_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "card_requests"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;
