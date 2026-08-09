const FORM_ENDPOINT = "https://formsubmit.co/ajax/heat.co2026@gmail.com";
const SITE_URL = "https://heat-energy-analytics-az.hasanov-ayxan.chatgpt.site/";

export async function POST(request: Request) {
  try {
    const values = (await request.json()) as Record<string, unknown>;
    const required = ["name", "company", "phone", "email"];

    if (required.some((field) => !String(values[field] ?? "").trim())) {
      return Response.json(
        { success: false, message: "Required fields are missing." },
        { status: 400 },
      );
    }

    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        ...values,
        _subject: "New HEAT Energy Assessment Request",
        _template: "table",
        _url: SITE_URL,
        source: "HEAT Website",
      }),
    });

    if (!response.ok) {
      return Response.json(
        { success: false, message: "Email delivery service rejected the request." },
        { status: 502 },
      );
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { success: false, message: "Unable to process the request." },
      { status: 500 },
    );
  }
}
