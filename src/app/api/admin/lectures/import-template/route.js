import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session.js";
import * as XLSX from "xlsx";

export async function GET(request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "xlsx";

    const rows = [
      {
        book: "Book 1: Partnership Accounts",
        chapter: "Fundamentals of Partnership",
        title: "Introduction to Partnership Deed",
        link: "https://vimeo.com/76979871",
        duration: "30:45",
        free: "yes",
      },
      {
        book: "Book 1: Partnership Accounts",
        chapter: "Fundamentals of Partnership",
        title: "Profit & Loss Appropriation Account",
        link: "https://vimeo.com/76979872",
        duration: "40:30",
        free: "no",
      },
      {
        book: "Book 1: Partnership Accounts",
        chapter: "Nature and Valuation of Goodwill",
        title: "Average Profit & Super Profit Methods",
        link: "https://vimeo.com/76979873",
        duration: "35:00",
        free: "no",
      },
      {
        book: "Book 2: Company Accounts",
        chapter: "Issue of Shares",
        title: "Forfeiture and Reissue of Shares",
        link: "https://vimeo.com/76979874",
        duration: "45:00",
        free: "no",
      },
    ];

    if (format === "csv") {
      const csvContent =
        "book,chapter,title,link,duration,free\n" +
        rows
          .map(
            (r) =>
              `"${r.book}","${r.chapter}","${r.title}","${r.link}","${r.duration}","${r.free}"`
          )
          .join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="rd_classes_lectures_template.csv"',
        },
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 30 }, // book
      { wch: 32 }, // chapter
      { wch: 38 }, // title
      { wch: 36 }, // link
      { wch: 14 }, // duration
      { wch: 10 }, // free
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lectures");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="rd_classes_lectures_template.xlsx"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to generate template" },
      { status: 500 }
    );
  }
}

