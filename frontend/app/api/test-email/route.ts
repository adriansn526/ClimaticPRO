import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log('Test Email Triggered');

    const port = parseInt(process.env.EMAIL_PORT || '465');
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'mail.climaticpro.ro',
        port: port,
        secure: port === 465,
        auth: {
            user: process.env.EMAIL_USER || 'contact@climaticpro.ro',
            pass: process.env.EMAIL_PASS,
        },
        logger: true,
        debug: true,
        tls: {
            // Do not fail on invalid certs (common for some hosting)
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log('SMTP Connection Successful');

        const info = await transporter.sendMail({
            from: '"ClimaticPRO Tester" <contact@climaticpro.ro>',
            to: process.env.EMAIL_USER || 'contact@climaticpro.ro', // Send to self
            subject: "Test Email from ClimaticPRO",
            text: "Evaluare conexiune SMTP. Dacă citești asta, funcționează.",
            html: "<b>Evaluare conexiune SMTP.</b> Dacă citești asta, funcționează."
        });

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully',
            messageId: info.messageId,
            response: info.response
        });

    } catch (error: any) {
        console.error('Test Email Failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code,
            command: error.command
        }, { status: 500 });
    }
}
