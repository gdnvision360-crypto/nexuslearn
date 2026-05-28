import { NextRequest } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import {
  SOCIAL_TEMPLATES,
  getTemplatesByCategory,
  getTemplateById,
  renderTemplate,
} from "@/lib/social-templates";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const templateId = searchParams.get("id");
    const variables = searchParams.get("variables"); // JSON string

    // Get single template by ID with variable rendering
    if (templateId) {
      const template = getTemplateById(templateId);
      if (!template) {
        return Response.json({ error: "Template not found" }, { status: 404 });
      }

      if (variables) {
        try {
          const vars = JSON.parse(variables);
          const rendered = renderTemplate(template.template, vars);
          return Response.json({ ...template, renderedContent: rendered });
        } catch {
          return Response.json(
            { error: "Invalid variables JSON" },
            { status: 400 }
          );
        }
      }

      return Response.json(template);
    }

    // Filter by category
    if (category) {
      return Response.json(getTemplatesByCategory(category));
    }

    // Return all templates grouped by category
    const categories = [...new Set(SOCIAL_TEMPLATES.map((t) => t.category))];
    const grouped = categories.map((cat) => ({
      category: cat,
      templates: SOCIAL_TEMPLATES.filter((t) => t.category === cat),
    }));

    return Response.json({ templates: SOCIAL_TEMPLATES, grouped });
  } catch (error) {
    return handleApiError(error);
  }
}
