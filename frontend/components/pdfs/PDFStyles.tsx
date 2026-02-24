import { Font, StyleSheet } from '@react-pdf/renderer';

// Register standard fonts (Roboto) from Google Fonts or CDN
// Note: We use a CDN link because we might not have the font files locally.
// Standard Roboto supports most Latin diacritics including Romanian (ă, â, î, ș, ț).
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontStyle: 'italic' },
    ],
});

export const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Roboto',
        fontSize: 10,
        color: '#333',
        lineHeight: 1.5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        borderBottom: 1,
        borderBottomColor: '#eee',
        paddingBottom: 20,
    },
    logo: {
        width: 120, // Adjust based on your logo aspect ratio
        height: 'auto',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50', // Dark Slate Blue
        textTransform: 'uppercase',
    },
    section: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    col: {
        flex: 1,
    },
    label: {
        fontSize: 9,
        color: '#7f8c8d', // Gray
        textTransform: 'uppercase',
        marginBottom: 4,
        fontWeight: 'bold',
    },
    value: {
        fontSize: 10,
        color: '#2c3e50',
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderColor: '#ecf0f1',
        marginTop: 20,
        marginBottom: 20,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableHeaderFunc: {
        backgroundColor: '#f8f9fa',
        fontWeight: 'bold',
    },
    tableCol: {
        width: '25%', // Default, can be overridden
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#ecf0f1',
    },
    tableCell: {
        margin: 5,
        fontSize: 9,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: '#95a5a6',
        fontSize: 8,
        borderTop: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    },
    colors: {
        primary: '#3498db',
        success: '#2ecc71',
    }
});
