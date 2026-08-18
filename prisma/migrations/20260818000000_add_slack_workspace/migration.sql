-- CreateTable
CREATE TABLE "slack_workspaces" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_name" TEXT NOT NULL,
    "workspace_id" TEXT,
    "client_id_enc" TEXT NOT NULL,
    "client_secret_enc" TEXT NOT NULL,
    "signing_secret_enc" TEXT NOT NULL,
    "bot_token_enc" TEXT NOT NULL,
    "bot_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slack_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slack_workspaces_user_id_key" ON "slack_workspaces"("user_id");

-- AddForeignKey
ALTER TABLE "slack_workspaces" ADD CONSTRAINT "slack_workspaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
