import React from 'react'
import './dotgrid-simple.css'

export default function DotGridSimple({ dot = 6, gap = 24, color = 'rgba(255,255,255,0.08)', style = {} }) {
  const size = `${dot}px`
  const spacing = `${gap}px`
  const cssVars = {
    '--dg-dot-size': size,
    '--dg-gap': spacing,
    '--dg-color': color,
    ...style
  }
  return <div className="dot-grid-simple" style={cssVars} aria-hidden="true" />
}
