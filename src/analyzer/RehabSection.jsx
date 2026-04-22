/* ============================================================================
   REHAB SECTION — planning + budgeting for the rehab scope.
   ============================================================================ */
import React, { useState, useMemo } from "react";
import { Hammer, Calendar } from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD, isMobile } from "../utils.js";
import { Panel } from "../primitives.jsx";

export const RehabSection = ({ deal, onUpdate }) => {
  const [rehabDetails, setRehabDetails] = useState(deal.rehabDetails || {
    kitchen: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    bathrooms: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    flooring: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    paintInterior: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    cabinets: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    appliances: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    lighting: { cost: 0, weeks: 0, priority: "low", contractor: "", notes: "" },
    electrical: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    plumbing: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    hvac: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    roofing: { cost: 0, weeks: 0, priority: "critical", contractor: "", notes: "" },
    windows: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    siding: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    landscaping: { cost: 0, weeks: 0, priority: "low", contractor: "", notes: "" },
    driveway: { cost: 0, weeks: 0, priority: "low", contractor: "", notes: "" },
    permits: { cost: 0, weeks: 0, priority: "critical", contractor: "", notes: "" },
    dumpster: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    contingency: { cost: 0, weeks: 0, priority: "critical", contractor: "", notes: "" }
  });

  const [rehabTimeline, setRehabTimeline] = useState(deal.rehabTimeline || {
    startDate: "",
    endDate: "",
    milestones: []
  });

  const rehabCategories = {
    interior: {
      name: "Interior Renovations",
      color: THEME.blue,
      items: ["kitchen", "bathrooms", "flooring", "paintInterior", "cabinets", "appliances", "lighting"]
    },
    systems: {
      name: "Major Systems",
      color: THEME.secondary,
      items: ["electrical", "plumbing", "hvac"]
    },
    structural: {
      name: "Structural & Exterior",
      color: THEME.green,
      items: ["roofing", "windows", "siding", "landscaping", "driveway"]
    },
    other: {
      name: "Permits & Contingency",
      color: THEME.purple,
      items: ["permits", "dumpster", "contingency"]
    }
  };

  const priorityColors = {
    critical: THEME.red,
    high: THEME.secondary,
    medium: THEME.accent,
    low: THEME.textMuted
  };

  const updateRehabDetail = (category, field, value) => {
    const updated = {
      ...rehabDetails,
      [category]: { ...rehabDetails[category], [field]: value }
    };
    setRehabDetails(updated);

    const totalCost = Object.values(updated).reduce((sum, item) => sum + (item.cost || 0), 0);
    const weekValues = Object.values(updated).map(item => item.weeks || 0);
    const totalWeeks = weekValues.length ? Math.max(...weekValues) : 0;

    onUpdate({
      rehabBudget: totalCost,
      rehabDetails: updated,
      rehabMonths: Math.ceil(totalWeeks / 4.33)
    });
  };

  const getTotalByCategory = (category) => {
    return rehabCategories[category].items.reduce((sum, item) => {
      return sum + (rehabDetails[item]?.cost || 0);
    }, 0);
  };

  const getOverallTotals = () => {
    const totalCost = Object.values(rehabDetails).reduce((sum, item) => sum + (item.cost || 0), 0);
    const weekValues = Object.values(rehabDetails).map(item => item.weeks || 0);
    const totalWeeks = weekValues.length ? Math.max(...weekValues) : 0;
    const criticalItems = Object.entries(rehabDetails).filter(([_, item]) => item.priority === "critical" && item.cost > 0).length;
    return { totalCost, totalWeeks, criticalItems };
  };

  const totals = getOverallTotals();

  return (
    <div>
      <Panel title="Comprehensive Rehab Planning" icon={<Hammer size={16} />} accent style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <div style={{ padding: 16, background: THEME.bgRaised, borderRadius: 6, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>TOTAL BUDGET</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: THEME.accent }}>
              {fmtUSD(totals.totalCost)}
            </div>
          </div>
          <div style={{ padding: 16, background: THEME.bgRaised, borderRadius: 6, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>TIMELINE</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: THEME.secondary }}>
              {Math.ceil(totals.totalWeeks / 4.33) || 0}mo
            </div>
          </div>
          <div style={{ padding: 16, background: THEME.bgRaised, borderRadius: 6, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>CRITICAL ITEMS</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: THEME.red }}>
              {totals.criticalItems}
            </div>
          </div>
          <div style={{ padding: 16, background: THEME.bgRaised, borderRadius: 6, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>$/SQ FT</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: THEME.text }}>
              {deal.sqft ? `$${(totals.totalCost / deal.sqft).toFixed(0)}` : "$0"}
            </div>
          </div>
        </div>

        {Object.entries(rehabCategories).map(([categoryKey, category]) => (
          <div key={categoryKey} style={{ marginBottom: 32 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16
            }}>
              <h4 style={{
                fontSize: 16,
                color: category.color,
                fontWeight: 600,
                margin: 0
              }}>
                {category.name}
              </h4>
              <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: category.color
              }}>
                {fmtUSD(getTotalByCategory(categoryKey))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {category.items.map(itemKey => {
                const item = rehabDetails[itemKey];
                const itemName = itemKey.charAt(0).toUpperCase() + itemKey.slice(1).replace(/([A-Z])/g, ' $1');

                return (
                  <div key={itemKey} style={{
                    padding: 16,
                    border: `1px solid ${item.cost > 0 ? category.color + '40' : THEME.border}`,
                    borderRadius: 6,
                    background: item.cost > 0 ? category.color + '0D' : THEME.bgPanel
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "2fr 1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
                      <div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8
                        }}>
                          <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: priorityColors[item.priority]
                          }} />
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{itemName}</span>
                          <span style={{
                            fontSize: 10,
                            color: priorityColors[item.priority],
                            textTransform: "uppercase",
                            fontWeight: 600
                          }}>
                            {item.priority}
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="Notes & specifications..."
                          value={item.notes}
                          onChange={(e) => updateRehabDetail(itemKey, 'notes', e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            fontSize: 12,
                            border: `1px solid ${THEME.border}`,
                            borderRadius: 3
                          }}
                        />
                      </div>

                      <div>
                        <div className="label-xs" style={{ marginBottom: 6 }}>Cost</div>
                        <input
                          type="number"
                          placeholder="$0"
                          value={item.cost}
                          onChange={(e) => updateRehabDetail(itemKey, 'cost', parseInt(e.target.value) || 0)}
                          style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: 13,
                            border: `1px solid ${THEME.border}`,
                            borderRadius: 3
                          }}
                        />
                      </div>

                      <div>
                        <div className="label-xs" style={{ marginBottom: 6 }}>Weeks</div>
                        <input
                          type="number"
                          placeholder="0"
                          value={item.weeks}
                          onChange={(e) => updateRehabDetail(itemKey, 'weeks', parseInt(e.target.value) || 0)}
                          style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: 13,
                            border: `1px solid ${THEME.border}`,
                            borderRadius: 3
                          }}
                        />
                      </div>

                      <div>
                        <div className="label-xs" style={{ marginBottom: 6 }}>Contractor</div>
                        <input
                          type="text"
                          placeholder="TBD"
                          value={item.contractor}
                          onChange={(e) => updateRehabDetail(itemKey, 'contractor', e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: 12,
                            border: `1px solid ${THEME.border}`,
                            borderRadius: 3
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 24 }}>
          <h4 style={{ fontSize: 14, marginBottom: 16, color: THEME.text }}>Quick Budget Templates</h4>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(4, 1fr)", gap: 12 }}>
            {[
              { name: "Light Cosmetic", factor: 15, desc: "Paint, flooring, fixtures" },
              { name: "Medium Rehab", factor: 25, desc: "Kitchen, bath, systems" },
              { name: "Heavy Renovation", factor: 40, desc: "Full gut, structural" },
              { name: "Luxury Upgrade", factor: 60, desc: "High-end finishes" }
            ].map(template => (
              <button
                key={template.name}
                onClick={() => {
                  const sqft = deal.sqft || 1500;
                  const budgetByCategory = {
                    kitchen: template.factor >= 25 ? sqft * 8 : 0,
                    bathrooms: template.factor >= 15 ? sqft * 5 : 0,
                    flooring: template.factor >= 15 ? sqft * 6 : 0,
                    paintInterior: template.factor >= 15 ? sqft * 2 : 0,
                    electrical: template.factor >= 25 ? sqft * 3 : 0,
                    plumbing: template.factor >= 25 ? sqft * 4 : 0,
                    hvac: template.factor >= 40 ? sqft * 6 : 0,
                    contingency: (sqft * template.factor) * 0.1
                  };

                  const updatedDetails = { ...rehabDetails };
                  Object.entries(budgetByCategory).forEach(([key, cost]) => {
                    if (updatedDetails[key]) {
                      updatedDetails[key] = { ...updatedDetails[key], cost };
                    }
                  });

                  setRehabDetails(updatedDetails);
                  onUpdate({
                    rehabDetails: updatedDetails,
                    rehabBudget: Object.values(budgetByCategory).reduce((sum, cost) => sum + cost, 0)
                  });
                }}
                style={{
                  padding: 12,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 6,
                  background: THEME.bgPanel,
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{template.name}</div>
                <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>{template.desc}</div>
                <div style={{ fontSize: 12, color: THEME.accent }}>
                  ~{fmtUSD((deal.sqft || 1500) * template.factor)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Project Timeline & Management" icon={<Calendar size={16} />}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <div className="label-xs" style={{ marginBottom: 6 }}>Estimated Start Date</div>
            <input
              type="date"
              value={rehabTimeline.startDate}
              onChange={(e) => {
                const updated = { ...rehabTimeline, startDate: e.target.value };
                setRehabTimeline(updated);
                onUpdate({ rehabTimeline: updated });
              }}
              style={{
                width: "100%",
                padding: "9px 10px",
                fontSize: 13,
                border: `1px solid ${THEME.border}`,
                borderRadius: 4
              }}
            />
          </div>
          <div>
            <div className="label-xs" style={{ marginBottom: 6 }}>Target Completion</div>
            <input
              type="date"
              value={rehabTimeline.endDate}
              onChange={(e) => {
                const updated = { ...rehabTimeline, endDate: e.target.value };
                setRehabTimeline(updated);
                onUpdate({ rehabTimeline: updated });
              }}
              style={{
                width: "100%",
                padding: "9px 10px",
                fontSize: 13,
                border: `1px solid ${THEME.border}`,
                borderRadius: 4
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <StatRow
            label="Total Rehab Budget"
            value={fmtUSD(totals.totalCost)}
            valueColor={THEME.accent}
            bold
          />
          <StatRow
            label="Cost per Square Foot"
            value={deal.sqft ? `$${(totals.totalCost / deal.sqft).toFixed(0)}` : "$0"}
            valueColor={THEME.secondary}
          />
          <StatRow
            label="Estimated Timeline"
            value={`${Math.ceil(totals.totalWeeks / 4.33) || 0} months`}
            valueColor={THEME.text}
          />
          <StatRow
            label="Critical Priority Items"
            value={`${totals.criticalItems} items`}
            valueColor={totals.criticalItems > 0 ? THEME.red : THEME.green}
          />
          <StatRow
            label="Budget as % of Purchase"
            value={`${deal.purchasePrice > 0 ? ((totals.totalCost / deal.purchasePrice) * 100).toFixed(1) : 0}%`}
            valueColor={((totals.totalCost / (deal.purchasePrice || 1)) * 100) < 20 ? THEME.green : THEME.orange}
          />
        </div>
      </Panel>
    </div>
  );
};
