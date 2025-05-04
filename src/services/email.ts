
/**
 * @fileOverview Email sending service using SendGrid.
 *
 * This file implements the email sending functionality for emergency notifications.
 */

'use server'; // Mark this module for server-side execution

import sgMail from '@sendgrid/mail';
import type { AnalysisResult } from './shadai'; // Assuming AnalysisResult is here

// Configure SendGrid API Key from environment variable
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("SendGrid API Key configured.");
} else {
  console.warn("SENDGRID_API_KEY environment variable not set. Email sending will fail.");
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

interface EmergencyEmailPayload {
  to: string;
  userName: string;
  riskSummary: string;
  analysisDetails: AnalysisResult; // Use the actual AnalysisResult type
}

/**
 * Sends an emergency notification email using SendGrid.
 *
 * @param payload - The email payload containing recipient, user info, and analysis details.
 * @returns A promise that resolves to true if the email was sent successfully, false otherwise.
 */
export async function sendEmergencyEmail(payload: EmergencyEmailPayload): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error("SendGrid API Key is not configured. Cannot send email.");
    return false;
  }
   if (!FROM_EMAIL) {
    console.error("SENDGRID_FROM_EMAIL environment variable not set. Cannot send email.");
    return false;
  }

  const formattedDetailsHtml = formatAnalysisDetailsForHtmlEmail(payload.analysisDetails);
  const formattedDetailsText = formatAnalysisDetailsForTextEmail(payload.analysisDetails);


  const msg = {
    to: payload.to,
    from: FROM_EMAIL, // Use the verified sender email from environment variable
    subject: `Alerta Urgente de Alumbra sobre ${payload.userName}`,
    text: `Hola,\n\nEste es un mensaje automático de Alumbra.\n\nSe ha detectado una situación de riesgo potencialmente grave para ${payload.userName} basada en un análisis de conversación reciente.\n\nResumen del Riesgo: ${payload.riskSummary}\n\nSe recomienda contactar a ${payload.userName} y considerar buscar ayuda profesional urgentemente.\n\nDetalles del Análisis:\n${formattedDetailsText}\n\nAtentamente,\nEl equipo de Alumbra`,
    html: `
      <p>Hola,</p>
      <p>Este es un mensaje automático de <strong>Alumbra</strong>.</p>
      <p>Se ha detectado una situación de <strong>riesgo potencialmente grave para ${payload.userName}</strong> basada en un análisis de conversación reciente.</p>
      <hr>
      <h3>Resumen del Riesgo:</h3>
      <p style="color: red; font-weight: bold;">${payload.riskSummary}</p>
      <hr>
      <h3>Detalles del Análisis:</h3>
      ${formattedDetailsHtml}
      <hr>
      <p>Se recomienda contactar a ${payload.userName} y considerar buscar ayuda profesional urgentemente.</p>
      <p>Atentamente,<br/>El equipo de Alumbra</p>
    `,
  };

  try {
    console.log(`Attempting to send emergency email to ${payload.to}...`);
    await sgMail.send(msg);
    console.log(`Emergency email successfully sent to ${payload.to}`);
    return true;
  } catch (error: any) {
    console.error('Error sending SendGrid email:', error);
    if (error.response) {
      // SendGrid specific error details
      console.error("SendGrid Error Body:", error.response.body);
      console.error("SendGrid Error Status Code:", error.response.statusCode);
      console.error("SendGrid Error Headers:", error.response.headers);
    }
    return false;
  }
}


/**
 * Formats analysis details into a simple HTML string for the email body.
 * @param details - The analysis result object.
 * @returns An HTML string representation of the key analysis details.
 */
function formatAnalysisDetailsForHtmlEmail(details: AnalysisResult): string {
    // Removed interlocutorName from parameters
    const affectedPersonDisplay = getAffectedPersonDisplayText(details.persona_afectada);
    let html = `<p><strong>Nivel de Riesgo:</strong> ${details.nivel_riesgo}/100</p>`;
    html += `<p><strong>Riesgo Inminente Detectado:</strong> ${details.riesgo_inminente ? '<strong>Sí</strong>' : 'No'}</p>`;
    html += `<p><strong>Posible Origen:</strong> ${details.posible_agresor}</p>`;
    html += `<p><strong>Persona Afectada Principalmente:</strong> ${affectedPersonDisplay}</p>`;


    if (details.categorias_detectadas.length > 0) {
        html += `<p><strong>Categorías Detectadas:</strong> ${details.categorias_detectadas.map(c => `<span style="background-color: #eee; padding: 2px 5px; border-radius: 3px; margin-right: 5px;">${c}</span>`).join(' ')}</p>`;
    }
    if (details.ejemplos.length > 0) {
        html += `<p><strong>Ejemplos Problemáticos Clave:</strong></p><ul>${details.ejemplos.slice(0, 5).map((ex: string) => `<li><em>"${ex}"</em></li>`).join('')}</ul>`; // Show first few examples
    }
    if (details.recomendaciones.length > 0) {
        // Prioritize imminent risk recommendations if present
        const recsToShow = details.riesgo_inminente
            ? details.recomendaciones.filter(rec => rec.toLowerCase().includes("urgente") || rec.toLowerCase().includes("seguridad"))
            : details.recomendaciones;

        html += `<p><strong>Recomendaciones Clave:</strong></p><ul>${recsToShow.slice(0, 3).map((rec: string) => `<li>${rec.substring(0, 250)}${rec.length > 250 ? '...' : ''}</li>`).join('')}</ul>`; // Show first few recommendations briefly
    }
    return html;
}

/**
 * Formats analysis details into a plain text string for the email body.
 * @param details - The analysis result object.
 * @returns A plain text string representation of the key analysis details.
 */
function formatAnalysisDetailsForTextEmail(details: AnalysisResult): string {
    // Removed interlocutorName from parameters
    const affectedPersonDisplay = getAffectedPersonDisplayText(details.persona_afectada);
    let text = `Nivel de Riesgo: ${details.nivel_riesgo}/100\n`;
    text += `Riesgo Inminente Detectado: ${details.riesgo_inminente ? 'Sí' : 'No'}\n`;
    text += `Posible Origen: ${details.posible_agresor}\n`;
    text += `Persona Afectada Principalmente: ${affectedPersonDisplay}\n`;

    if (details.categorias_detectadas.length > 0) {
        text += `Categorías Detectadas: ${details.categorias_detectadas.join(', ')}\n`;
    }
    if (details.ejemplos.length > 0) {
        text += `Ejemplos Problemáticos Clave:\n${details.ejemplos.slice(0, 5).map((ex: string) => `- "${ex}"`).join('\n')}\n`;
    }
    if (details.recomendaciones.length > 0) {
        const recsToShow = details.riesgo_inminente
            ? details.recomendaciones.filter(rec => rec.toLowerCase().includes("urgente") || rec.toLowerCase().includes("seguridad"))
            : details.recomendaciones;
        text += `Recomendaciones Clave:\n${recsToShow.slice(0, 3).map((rec: string) => `- ${rec.substring(0, 250)}${rec.length > 250 ? '...' : ''}`).join('\n')}\n`;
    }
    return text;
}

/**
 * Helper function to get display text for the affected person.
 * @param affectedType - The type of affected person.
 * @returns A display string for the affected person.
 */
function getAffectedPersonDisplayText(affectedType: AnalysisResult['persona_afectada']): string {
    // Removed interlocutorName parameter
    switch (affectedType) {
        case 'usuario':
            return 'El usuario que proporcionó la conversación';
        case 'interlocutor':
             // Using generic terms instead of name/pronoun
            return 'La otra persona';
        case 'ambos':
            return 'Ambas partes';
        case 'grupo':
            return 'Miembros del grupo';
        case 'ninguno':
        default:
            return 'Ninguno identificado claramente';
    }
}
