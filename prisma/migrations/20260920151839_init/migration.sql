-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('BOY', 'GIRL', 'UNISEX');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE', 'APPLE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" TEXT,
    "auth_provider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
    "country" VARCHAR(80),
    "language_preference" VARCHAR(20) NOT NULL DEFAULT 'en',
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baby_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "baby_name" VARCHAR(100),
    "gender" "Gender" NOT NULL,
    "dob" DATE NOT NULL,
    "birth_time" VARCHAR(10),
    "birth_place" VARCHAR(150),
    "nakshatra" VARCHAR(50),
    "rashi" VARCHAR(50),
    "preferred_style" VARCHAR(50),
    "preferred_length_max" INTEGER,
    "preferred_start_syllable" VARCHAR(10),
    "religion" VARCHAR(50) NOT NULL DEFAULT 'Hindu',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baby_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "names" (
    "id" UUID NOT NULL,
    "name_romanized" VARCHAR(100) NOT NULL,
    "name_native" VARCHAR(100) NOT NULL,
    "starting_syllable" VARCHAR(10) NOT NULL,
    "gender" "Gender" NOT NULL,
    "origin" VARCHAR(100) NOT NULL DEFAULT 'Sanskrit',
    "meaning" TEXT NOT NULL,
    "pronunciation" VARCHAR(255),
    "syllables_count" INTEGER NOT NULL,
    "character_length" INTEGER NOT NULL,
    "popularity_score" INTEGER NOT NULL DEFAULT 0,
    "trend_score" INTEGER NOT NULL DEFAULT 0,
    "modernity_score" INTEGER NOT NULL DEFAULT 50,
    "spirituality_score" INTEGER NOT NULL DEFAULT 50,
    "uniqueness_score" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "name_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" TEXT,

    CONSTRAINT "name_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "name_category_mappings" (
    "name_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "name_category_mappings_pkey" PRIMARY KEY ("name_id","category_id")
);

-- CreateTable
CREATE TABLE "astrology_mappings" (
    "id" UUID NOT NULL,
    "nakshatra" VARCHAR(50) NOT NULL,
    "pada" INTEGER NOT NULL,
    "recommended_syllables" JSONB NOT NULL,
    "rashi" VARCHAR(50) NOT NULL,

    CONSTRAINT "astrology_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "name_astrology_scores" (
    "id" UUID NOT NULL,
    "name_id" UUID NOT NULL,
    "nakshatra" VARCHAR(50) NOT NULL,
    "rashi" VARCHAR(50) NOT NULL,
    "compatibility_score" INTEGER NOT NULL,

    CONSTRAINT "name_astrology_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "numerology_scores" (
    "id" UUID NOT NULL,
    "name_id" UUID NOT NULL,
    "destiny_number" INTEGER NOT NULL,
    "soul_number" INTEGER NOT NULL,
    "expression_number" INTEGER NOT NULL,
    "prosperity_score" INTEGER NOT NULL DEFAULT 50,
    "harmony_score" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "numerology_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" UUID NOT NULL,
    "baby_profile_id" UUID NOT NULL,
    "name_id" UUID NOT NULL,
    "ai_score" DECIMAL(5,2) NOT NULL,
    "astrology_score" DECIMAL(5,2) NOT NULL,
    "numerology_score" DECIMAL(5,2) NOT NULL,
    "final_score" DECIMAL(5,2) NOT NULL,
    "recommendation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_names" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "baby_profile_id" UUID NOT NULL,
    "name_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "search_query" TEXT NOT NULL,
    "filters" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "name_trends" (
    "id" UUID NOT NULL,
    "name_id" UUID NOT NULL,
    "search_count" INTEGER NOT NULL DEFAULT 0,
    "save_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "trend_rank" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "name_trends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voting_sessions" (
    "id" UUID NOT NULL,
    "baby_profile_id" UUID NOT NULL,
    "share_code" VARCHAR(20) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voting_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" UUID NOT NULL,
    "voting_session_id" UUID NOT NULL,
    "name_id" UUID NOT NULL,
    "voter_name" VARCHAR(120) NOT NULL,
    "vote_score" INTEGER NOT NULL,
    "comment" TEXT,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "plan_name" VARCHAR(50) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'EXPIRED',
    "renewal_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_pronunciations" (
    "id" UUID NOT NULL,
    "name_id" UUID NOT NULL,
    "audio_url" TEXT NOT NULL,
    "language" VARCHAR(20) NOT NULL DEFAULT 'hi',

    CONSTRAINT "audio_pronunciations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "names_name_romanized_idx" ON "names"("name_romanized");

-- CreateIndex
CREATE INDEX "names_starting_syllable_gender_idx" ON "names"("starting_syllable", "gender");

-- CreateIndex
CREATE INDEX "names_popularity_score_trend_score_idx" ON "names"("popularity_score" DESC, "trend_score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "name_categories_name_key" ON "name_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "astrology_mappings_nakshatra_pada_key" ON "astrology_mappings"("nakshatra", "pada");

-- CreateIndex
CREATE INDEX "name_astrology_scores_name_id_idx" ON "name_astrology_scores"("name_id");

-- CreateIndex
CREATE UNIQUE INDEX "numerology_scores_name_id_key" ON "numerology_scores"("name_id");

-- CreateIndex
CREATE INDEX "recommendations_final_score_idx" ON "recommendations"("final_score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "recommendations_baby_profile_id_name_id_key" ON "recommendations"("baby_profile_id", "name_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_names_baby_profile_id_name_id_key" ON "saved_names"("baby_profile_id", "name_id");

-- CreateIndex
CREATE UNIQUE INDEX "name_trends_name_id_key" ON "name_trends"("name_id");

-- CreateIndex
CREATE UNIQUE INDEX "voting_sessions_share_code_key" ON "voting_sessions"("share_code");

-- CreateIndex
CREATE UNIQUE INDEX "audio_pronunciations_name_id_key" ON "audio_pronunciations"("name_id");

-- AddForeignKey
ALTER TABLE "baby_profiles" ADD CONSTRAINT "baby_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "name_category_mappings" ADD CONSTRAINT "name_category_mappings_name_id_fkey" FOREIGN KEY ("name_id") REFERENCES "names"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "name_category_mappings" ADD CONSTRAINT "name_category_mappings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "name_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "name_astrology_scores" ADD CONSTRAINT "name_astrology_scores_name_id_fkey" FOREIGN KEY ("name_id") REFERENCES "names"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "numerology_scores" ADD CONSTRAINT "numerology_scores_name_id_fkey" FOREIGN KEY ("name_id") REFERENCES "names"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_baby_profile_id_fkey" FOREIGN KEY ("baby_profile_id") REFERENCES "baby_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_name_id_fkey" FOREIGN KEY ("name_id") REFERENCES "names"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_names" ADD CONSTRAINT "saved_names_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_names" ADD CONSTRAINT "saved_names_baby_profile_id_fkey" FOREIGN KEY ("baby_profile_id") REFERENCES "baby_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_names" ADD CONSTRAINT "saved_names_name_id_fkey" FOREIGN KEY ("name_id") REFERENCES "names"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "name_trends" ADD CONSTRAINT "name_trends_name_id_fkey" FOREIGN KEY ("name_id") REFERENCES "names"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voting_sessions" ADD CONSTRAINT "voting_sessions_baby_profile_id_fkey" FOREIGN KEY ("baby_profile_id") REFERENCES "baby_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_voting_session_id_fkey" FOREIGN KEY ("voting_session_id") REFERENCES "voting_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_name_id_fkey" FOREIGN KEY ("name_id") REFERENCES "names"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_pronunciations" ADD CONSTRAINT "audio_pronunciations_name_id_fkey" FOREIGN KEY ("name_id") REFERENCES "names"("id") ON DELETE CASCADE ON UPDATE CASCADE;
