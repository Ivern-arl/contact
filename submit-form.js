const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Méthode non autorisée",
    };
  }

  const data = JSON.parse(event.body);
  const token = data["g-recaptcha-response"];

  if (!token) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "reCAPTCHA non fourni." }),
    };
  }

  // ⚠️ Remplace par ta vraie clé secrète reCAPTCHA
  const secretKey = "6LdcDpMrAAAAAKAooAJn7XdjY2opjgCg-8iC1Cmj";

  const params = new URLSearchParams();
  params.append("secret", secretKey);
  params.append("response", token);

  const recaptchaRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const recaptchaJson = await recaptchaRes.json();

  if (!recaptchaJson.success) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Échec de reCAPTCHA." }),
    };
  }

  // ✅ Supprime le token avant d’envoyer à Formspree
  delete data["g-recaptcha-response"];

  const formspreeRes = await fetch("https://formspree.io/f/mzzvgjjd", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!formspreeRes.ok) {
    return {
      statusCode: formspreeRes.status,
      body: JSON.stringify({ error: "Erreur lors de l’envoi à Formspree." }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};
