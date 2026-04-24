const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const pageId = "102563252454527";
    const pageName = "Climaticpro";
    const pageAccessToken = "EAAawZBGyAEbEBQ3hd1fnk6DD6ZAFrbxy2AGkT5r8uFpWscNRQ5FvwcxcHObSqe6jWSVJxk6lQrYSI3MZCb4mS7jRQLjnPQ2fia0kHjtXYgrZBpbVgBE8sFpwzz011oNLSV6ktSaRLpSD4tsPU1HZBKAKByZAKmJsGAoHOnAY1VwuOZBUs8AkvnoYdpiZABliITc1Gp5jQpnaFZA5otFV6Kn9tfWSr75vNuTZC0lCUhCuF96wZDZD";

    try {
        const result = await prisma.socialAccount.upsert({
            where: {
                platform_accountId: {
                    platform: 'facebook',
                    accountId: pageId
                }
            },
            update: {
                accessToken: pageAccessToken,
                accountName: pageName,
            },
            create: {
                platform: 'facebook',
                accountId: pageId,
                accessToken: pageAccessToken,
                accountName: pageName
            }
        });
        console.log("Successfully inserted Manual Page Token into DB:", result.accountId);

        console.log("Checking for linked Instagram Business Account...");
        const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`);
        const fbData = await fbRes.json();

        if (fbData.instagram_business_account && fbData.instagram_business_account.id) {
            const igAccountId = fbData.instagram_business_account.id;
            const igResult = await prisma.socialAccount.upsert({
                where: {
                    platform_accountId: {
                        platform: 'instagram',
                        accountId: igAccountId
                    }
                },
                update: {
                    accessToken: pageAccessToken,
                    accountName: pageName + " (Instagram)",
                },
                create: {
                    platform: 'instagram',
                    accountId: igAccountId,
                    accessToken: pageAccessToken,
                    accountName: pageName + " (Instagram)"
                }
            });
            console.log("Successfully inserted Instagram Account Token into DB:", igResult.accountId);
        } else {
            console.log("No linked Instagram business account found. Make sure the Instagram account is a Professional account and linked to the Facebook Page.");
        }

    } catch (err) {
        console.error("DB Insert Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
