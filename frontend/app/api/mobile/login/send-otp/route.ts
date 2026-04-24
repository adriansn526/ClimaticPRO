import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SMSO_API_KEY = process.env.SMSO_API_KEY || '6iABkheApb8L6a0bpJY2amhCYPD5Bo9zu9a4EuHj';
const SMSO_SENDER_ID = process.env.SMSO_SENDER_ID || ''; // Empty string so SMSO uses account default

export async function POST(req: Request) {
    try {
        const { phone, appHash } = await req.json();

        if (!phone) {
            return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
        }

        // Clean phone number (remove spaces, +40, etc)
        let cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('40') && cleanPhone.length === 11) {
            cleanPhone = '+' + cleanPhone; // Proper E.164 with plus
        } else if (cleanPhone.startsWith('0')) {
            cleanPhone = '+40' + cleanPhone.substring(1); // Format for Romania
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Store or update OTP in database
        await prisma.otpVerification.upsert({
            where: { phone: cleanPhone },
            update: { code: otpCode, expiresAt },
            create: { phone: cleanPhone, code: otpCode, expiresAt }
        });

        let messageBody = `Codul tau de verificare ClimaticPRO este: ${otpCode}. Acest cod este valabil 10 minute.`;

        const formData = new URLSearchParams();
        formData.append('to', cleanPhone);
        formData.append('body', messageBody);
        formData.append('sender', SMSO_SENDER_ID || '4');

        console.log(`[SMS DEBUG] Sending OTP to: ${cleanPhone}`);
        console.log(`[SMS DEBUG] Payload Body: ${messageBody}`);
        console.log(`[SMS DEBUG] Sender ID: ${SMSO_SENDER_ID || '4'}`);

        // Send SMS via SMSO API
        const smsResponse = await fetch('https://app.smso.ro/api/v1/send', {
            method: 'POST',
            headers: {
                'X-Authorization': SMSO_API_KEY,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        console.log(`[SMS DEBUG] SMSO HTTP Status: ${smsResponse.status}`);

        if (!smsResponse.ok) {
            const errorData = await smsResponse.text();
            console.error('SMSO API Error:', errorData);
            // Return success anyway for local dev/testing if SMSO fails, but log error.
            if (process.env.NODE_ENV === 'development') {
                console.log(`[DEV MODE] OTP for ${cleanPhone} is ${otpCode}`);
                return NextResponse.json({ message: 'OTP Generated (SMS failed but Dev mode active)' });
            }
            return NextResponse.json({ message: 'Nu s-a putut trimite SMS-ul', details: errorData }, { status: 500 });
        }

        const responseText = await smsResponse.text();
        console.log(`[SMS DEBUG] SMSO Success Response: ${responseText}`);

        return NextResponse.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
