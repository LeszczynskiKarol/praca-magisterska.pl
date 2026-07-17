-- Wyrównanie i style dla wzorów: działa i w PDF (LaTeX), i w DOCX.
-- DOCX korzysta z custom-style zdefiniowanych w reference.docx.
function Div(el)
  local function wrap_latex(pre, post)
    return { pandoc.RawBlock("latex", pre), el, pandoc.RawBlock("latex", post) }
  end
  if el.classes:includes("center") then
    if FORMAT:match("latex") then return wrap_latex("\\begin{center}", "\\end{center}") end
    if FORMAT:match("docx") then el.attributes["custom-style"] = "Center"; return el end
  elseif el.classes:includes("right") then
    if FORMAT:match("latex") then return wrap_latex("\\begin{flushright}", "\\end{flushright}") end
    if FORMAT:match("docx") then el.attributes["custom-style"] = "Right"; return el end
  elseif el.classes:includes("anno") then
    if FORMAT:match("latex") then
      return wrap_latex("\\par\\noindent\\begingroup\\small\\itshape\\color{brand}", "\\par\\endgroup")
    end
    if FORMAT:match("docx") then el.attributes["custom-style"] = "Anno"; return el end
  elseif el.classes:includes("promo") then
    if FORMAT:match("latex") then
      return wrap_latex("\\begin{promobox}\\setlength{\\parindent}{0pt}", "\\end{promobox}")
    end
    if FORMAT:match("docx") then el.attributes["custom-style"] = "Note"; return el end
  elseif el.classes:includes("note") then
    if FORMAT:match("latex") then
      return wrap_latex(
        "\\par\\medskip\\noindent\\fcolorbox{brand}{noteBg}{\\parbox{\\dimexpr\\linewidth-2\\fboxsep-2\\fboxrule}{\\small\\setlength{\\parindent}{0pt}",
        "}}\\par\\medskip")
    end
    if FORMAT:match("docx") then el.attributes["custom-style"] = "Note"; return el end
  end
end
