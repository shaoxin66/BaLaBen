
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { AnalysisResult } from '../types';

interface Props {
  data: AnalysisResult;
}

const RelationshipGraph: React.FC<Props> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data.characters.length || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 600;

    // 清除旧的图形
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font-family: sans-serif;");

    // 数据处理：确保节点 ID 唯一，防止同名冲突
    const uniqueCharacters = new Map();
    data.characters.forEach(c => {
      if (!uniqueCharacters.has(c.name)) {
        uniqueCharacters.set(c.name, { ...c, id: c.name });
      }
    });
    
    const nodes = Array.from(uniqueCharacters.values());
    const nodeNames = new Set(nodes.map(n => n.name));

    const links = data.relationships
      .filter(r => nodeNames.has(r.source) && nodeNames.has(r.target))
      .map(r => ({ ...r, value: 1 }));

    // 颜色配置
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // 物理力学仿真配置
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(180))
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(70));

    // 定义箭头
    const defs = svg.append("defs");
    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 32)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#6366f1");

    // 连线
    const link = svg.append("g")
      .attr("stroke", "#4338ca")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow)");

    // 关系文字
    const linkLabel = svg.append("g")
        .selectAll("text")
        .data(links)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", -8)
        .text((d: any) => d.type)
        .attr("fill", "#a5b4fc")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .style("text-shadow", "0 1px 2px rgba(0,0,0,0.8)")
        .style("pointer-events", "none");

    // 节点容器
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "grab")
      .call(drag(simulation) as any);

    // 节点背景阴影
    node.append("circle")
      .attr("r", 28)
      .attr("fill", "rgba(0,0,0,0.3)")
      .attr("filter", "blur(4px)");

    // 节点主体
    node.append("circle")
      .attr("r", 25)
      .attr("fill", (d) => color(d.id))
      .attr("stroke", "#1e1b4b")
      .attr("stroke-width", 2);
      
    // 角色首字母
    node.append("text")
      .text(d => d.name.substring(0, 1))
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", "14px")
      .attr("font-weight", "black")
      .attr("pointer-events", "none");

    // 姓名标签
    const label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("text-anchor", "middle")
      .text(d => d.name)
      .attr("fill", "#e2e8f0")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.9)")
      .attr("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkLabel
        .attr("transform", (d: any) => {
            if (!d.source.x || !d.target.x) return "";
            const x = (d.source.x + d.target.x) / 2;
            const y = (d.source.y + d.target.y) / 2;
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            let angle = Math.atan2(dy, dx) * 180 / Math.PI;
            if (angle > 90 || angle < -90) angle += 180; 
            return `translate(${x},${y}) rotate(${angle})`;
        });

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y + 45); 
    });

    function drag(simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
        simulation.stop();
    };
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
        <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] uppercase font-black tracking-widest text-slate-500">
            Drag nodes to adjust layout
        </div>
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default RelationshipGraph;
