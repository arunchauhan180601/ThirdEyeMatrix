const { db } = require("../../config/db");
const { sendReportEmail } = require("../../utils/mail");

// ---------------------- Get Reports (Logged-in User) ----------------------
async function getReports(req, res) {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const store = await db("stores").where({ user_id: userId }).first();
    const store_URL = store.store_URL;

    const reports = await db("reports")
      .where({ user_id: userId })
      .orderBy("created_at", "desc");

    return res.status(200).json({
      message: "Reports fetched successfully",
      count: reports.length,
      store: store_URL,
      reports,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// ---------------------- Create Report ----------------------
async function createReport(req, res) {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const store = await db("stores").where({ user_id: userId }).first();
    if (!store) return res.status(404).json({ message: "Store not found" });
    const storeId = store.id;

    const {
      report_title,
      report_frequency,
      time_of_day,
      recipients_email,
      selected_metrics,
    } = req.body;

    if (
      !report_title ||
      !report_frequency ||
      !time_of_day ||
      !recipients_email ||
      !selected_metrics
    ) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided" });
    }

    const [newReport] = await db("reports")
      .insert({
        user_id: userId,
        store_id: storeId,
        report_title,
        report_frequency,
        time_of_day,
        recipients_email,
        selected_metrics: JSON.stringify(selected_metrics),
      })
      .returning("*");

    return res.status(201).json({
      message: "Report created successfully",
      report: newReport,
    });
  } catch (error) {
    console.error("Error creating report:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function sendReportNow(req, res) {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

   const store = await db("stores").where({ user_id: userId }).first();
    if (!store) return res.status(404).json({ message: "Store not found" });
    const storeURL = store.store_URL;


    const {
      report_title,
      report_frequency,
      time_of_day,
      recipients_email,
      selected_metrics,
      metrics_with_values,
      dashboard_pdf,
      dashboard_format,
      dashboard_prompt,
      advanced_insights,
    } = req.body;

    if (!recipients_email)
      return res.status(400).json({ error: "Recipient email is required" });

    let htmlContent = "";
    let attachments = [];

    // Check if dashboard PDF is provided
    if (dashboard_pdf && dashboard_format === "PDF") {
      // Dashboard PDF mode
      htmlContent = `
        <div style="font-family: sans-serif; background-color:#f9fafb; padding:20px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="max-width:650px; margin:auto; background:#ffffff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); overflow:hidden;">
            <tr>
                <td style="background:#2563eb; color:white; padding:16px 20px; text-align:center; font-size:22px; font-weight:bold;">
                📊 ${report_title}
                </td>
            </tr>
            <tr>
                <td style="padding:20px;">
                <p style="font-size:16px; margin:0 0 10px;"><strong>Frequency:</strong> ${report_frequency}</p>
                <p style="font-size:16px; margin:0 0 10px;"><strong>Time of Day:</strong> ${time_of_day}</p>
                ${
                  dashboard_prompt
                    ? `<p style="font-size:16px; margin:0 0 10px;"><strong>Prompt:</strong> ${dashboard_prompt}</p>`
                    : ""
                }
                ${
                  advanced_insights
                    ? `<p style="font-size:14px; margin:10px 0; color:#16a34a;">✓ Advanced insights included</p>`
                    : ""
                }

                <div style="margin-top:25px; padding:15px; background:#f0f9ff; border-left:4px solid #2563eb; border-radius:4px;">
                    <p style="margin:0; font-size:15px; color:#1e40af;">
                      📎 <strong>Dashboard Report Attached</strong>
                    </p>
                    <p style="margin:5px 0 0; font-size:14px; color:#64748b;">
                      Please find the dashboard PDF report attached to this email.
                    </p>
                </div>

                <p style="margin-top:30px; font-size:14px; color:#6b7280; text-align:center;">
                    — Sent from <strong style="color:#2563eb;">Third Eye Matrix</strong>
                </p>
                </td>
            </tr>
            </table>
        </div>
      `;

      // Convert base64 PDF to buffer
      let base64Data = dashboard_pdf;

      console.log(
        "Received PDF data (first 100 chars):",
        base64Data.substring(0, 100)
      );

      // Remove data URI prefix if present
      if (
        base64Data.includes(
          "data:application/pdf;filename=generated.pdf;base64,"
        )
      ) {
        base64Data = base64Data.split(
          "data:application/pdf;filename=generated.pdf;base64,"
        )[1];
      } else if (base64Data.includes("data:application/pdf;base64,")) {
        base64Data = base64Data.split("data:application/pdf;base64,")[1];
      } else if (base64Data.startsWith("data:")) {
        // Generic data URI handler - split by first comma
        const parts = base64Data.split(",");
        if (parts.length > 1) {
          base64Data = parts[1];
        }
      }

      // Clean up any whitespace, newlines, or invalid characters
      base64Data = base64Data.replace(/[\s\n\r]/g, "");

      console.log("Cleaned base64 data length:", base64Data.length);
      console.log(
        "Cleaned base64 data (first 50 chars):",
        base64Data.substring(0, 50)
      );

      // Validate base64
      if (!base64Data || base64Data.length === 0) {
        throw new Error("Invalid PDF data: empty after processing");
      }

      // Check if it's valid base64
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(base64Data)) {
        throw new Error("Invalid PDF data: not valid base64 format");
      }

      const pdfBuffer = Buffer.from(base64Data, "base64");

      console.log("PDF Buffer created, size:", pdfBuffer.length, "bytes");

      // Validate PDF header (should start with %PDF)
      const pdfHeader = pdfBuffer.toString("utf8", 0, 4);
      console.log("PDF Header:", pdfHeader);
      if (!pdfHeader.startsWith("%PDF")) {
        console.error("Invalid PDF: header is", pdfHeader, "instead of %PDF");
        throw new Error(
          "Invalid PDF data: file does not have valid PDF header"
        );
      }

      const filename = `${report_title.replace(/[^a-z0-9]/gi, "_")}_Dashboard_${
        new Date().toISOString().split("T")[0]
      }.pdf`;

      attachments.push({
        filename: filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      });

      console.log("PDF attachment prepared:", filename);
    } else {


      // Metrics mode (existing functionality)
      const metricsToDisplay =
        metrics_with_values ||
        (selected_metrics || []).map((metric) => ({
          name: metric,
          value: "N/A",
        }));

      // Function to format current date nicely (e.g., Oct 31, 2025)
      function formatDate(date) {
        const options = { month: "short", day: "2-digit", year: "numeric" };
        return date.toLocaleDateString("en-US", options);
      }

      const reportCreatedDate = formatDate(new Date());

      htmlContent = `
        <div style="font-family: Inter, Arial, sans-serif; background-color:#f9fafb; padding:20px;">
          <table width="100%" cellspacing="0" cellpadding="0" style="max-width:650px; margin:auto; background:#ffffff; border-radius:16px; box-shadow:0 2px 8px rgba(0,0,0,0.08); overflow:hidden;">
            <!-- Header -->
            <tr>
              <td style="background:#e8f0fe; text-align:center; padding:30px 20px;">
                <img src="https://cdn-icons-png.flaticon.com/512/991/991952.png" alt="Logo" width="40" height="40" style="margin-bottom:10px;" />
                <h2 style="margin:0; color:#111827; font-size:20px; font-weight:600;">${report_title}</h2>
                <p style="margin:4px 0 0; color:#dbeafe; font-size:14px;">${storeURL}</p>
              </td>
            </tr>

            <!-- Date Comparison -->
            <tr>
              <td style="padding:16px 20px; text-align:center;">
                <p style="font-size:14px; color:#374151; margin:2px;">
                  🗓️ Report generated on: <strong>${reportCreatedDate}</strong>
                </p>
                <a href="#" style="color:#2563eb; font-size:14px; margin-top:6px; text-decoration:none; font-weight:500;">View Report in App</a>
              </td>
            </tr>

            <!-- Metrics Section -->
            <tr>
              <td style="padding:10px 20px 25px;">
                ${metricsToDisplay
                  .map(
                    (metric, index) => `
                  <div style="border:1px solid #e5e7eb; border-radius:12px; padding:18px 24px; margin-top:18px;">
                    <div style=" padding-top:5px; padding-bottom:10px;">
                      <!-- Left Side: Metric Name and Change -->
                      <div style="flex:1; padding-bottom:5px;">
                        <p style="margin:0; font-size:15.5px; color:#111827; font-weight:600; padding-bottom:5px;">${
                          metric.name
                        }</p>
                        ${
                          metric.change
                            ? `<p style="margin:4px 0 0; font-size:13.5px; color:${
                                metric.change > 0 ? "#16a34a" : "#dc2626"
                              }; font-weight:500;">
                                ${
                                  metric.change > 0 ? "▲" : "▼"
                                } ${metric.change.toFixed(2)}%
                              </p>`
                            : `<p style="margin:4px 0 0; font-size:13.5px; color:#6b7280;">(0%)</p>`
                        }
                      </div>

                      <!-- Right Side: Amount -->
                      <div style="flex-shrink:0; text-align:left; min-width:120px;">
                        <p style="margin:0; font-size:18px; font-weight:700; color:#111827; letter-spacing:0.3px;">
                          ${
                            (() => {
                              // Convert string to number if possible for formatting
                              const numValue = typeof metric.value === "string" && !isNaN(parseFloat(metric.value))
                                ? parseFloat(metric.value)
                                : typeof metric.value === "number"
                                ? metric.value
                                : null;
                              
                              const displayValue = numValue !== null ? numValue.toLocaleString() : metric.value;
                              
                              if (!metric.format || metric.format === "rupees") {
                                return "INR " + displayValue;
                              } else if (metric.format === "percentage") {
                                return displayValue + "%";
                              } else {
                                return displayValue;
                              }
                            })()
                          }
                        </p>
                        ${
                          metric.previous
                            ? `<p style="margin:3px 0 0; font-size:13.5px; color:#6b7280;">(${metric.previous} ${!metric.format || metric.format === "rupees" ? "INR" : metric.format === "percentage" ? "%" : ""})</p>`
                            : ""
                        }
                      </div>
                    </div>
                  </div>
                  `
                  )
                  .join("")}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="text-align:center; padding:20px; background:#f9fafb; font-size:13px; color:#6b7280;">
                — Sent from <strong style="color:#2563eb;">Third Eye Matrix</strong>
              </td>
            </tr>
          </table>
        </div>
      `;
    }

    // Send email with or without attachments
    await sendReportEmail(
      recipients_email,
      `📊 ${report_title} Report`,
      htmlContent,
      attachments
    );

    return res.status(200).json({ message: "Report email sent successfully" });
  } catch (error) {
    console.error("Error sending report email:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// ---------------------- Update Report ----------------------
async function updateReport(req, res) {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const {
      report_title,
      report_frequency,
      time_of_day,
      recipients_email,
      selected_metrics,
      dashboard_format,
      dashboard_prompt,
      advanced_insights,
    } = req.body;

    // Check if report exists and belongs to user
    const existingReport = await db("reports")
      .where({ id, user_id: userId })
      .first();

    if (!existingReport) {
      return res.status(404).json({ message: "Report not found" });
    }

    const updateData = {};
    if (report_title !== undefined) updateData.report_title = report_title;
    if (report_frequency !== undefined)
      updateData.report_frequency = report_frequency;
    if (time_of_day !== undefined) updateData.time_of_day = time_of_day;
    if (recipients_email !== undefined)
      updateData.recipients_email = recipients_email;
    if (selected_metrics !== undefined)
      updateData.selected_metrics = JSON.stringify(selected_metrics);

    updateData.updated_at = db.fn.now();

    await db("reports").where({ id }).update(updateData);

    const updatedReport = await db("reports")
      .where({ id })
      .first();

    return res.status(200).json({
      message: "Report updated successfully",
      report: updatedReport,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// ---------------------- Delete Report ----------------------
async function deleteReport(req, res) {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    // Check if report exists and belongs to user
    const existingReport = await db("reports")
      .where({ id, user_id: userId })
      .first();

    if (!existingReport) {
      return res.status(404).json({ message: "Report not found" });
    }

    await db("reports").where({ id }).del();

    return res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  createReport,
  getReports,
  sendReportNow,
  updateReport,
  deleteReport,
};
