/** Deterministic SHOR computations. No payment authorization is performed here. */
function bad(s){ throw new Error(s); }
export function conwayStep(grid){
 if(!Array.isArray(grid)||grid.length<1||grid.length>100) bad('invalid grid height');
 const width=grid[0]?.length;
 if(!Number.isInteger(width)||width<1||width>100) bad('invalid grid width');
 if(grid.some(row=>!Array.isArray(row)||row.length!==width||row.some(x=>x!==0&&x!==1))) bad('grid must be rectangular binary matrix');
 return grid.map((row,r)=>row.map((v,c)=>{
  let n=0;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
   if(!dr&&!dc) continue;
   const rr=r+dr,cc=c+dc;if(rr>=0&&rr<grid.length&&cc>=0&&cc<width)n+=grid[rr][cc];
  }
  return (n===3||(v===1&&n===2))?1:0;
 }));
}
export function runConway(grid,steps=1){
 if(!Number.isInteger(steps)||steps<0||steps>1000) bad('invalid number of steps');
 let current=grid;
 // Validate even when steps = 0
 current=conwayStep(current);
 if(steps===0) return grid.map(r=>r.slice());
 for(let i=1;i<steps;i++)current=conwayStep(current);
 return current;
}
/** Brute-force globally optimal QUBO for at most 20 variables (bounded CPU). */
export function solveQubo(matrix){
 const n=matrix?.length;
 if(!Array.isArray(matrix)||!Number.isInteger(n)||n<1||n>20||matrix.some(row=>!Array.isArray(row)||row.length!==n||row.some(v=>typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e9))) bad('QUBO requires a finite square matrix of size 1..20');
 let bestEnergy=Infinity,bestBits=null;
 const candidates=2**n;
 for(let mask=0;mask<candidates;mask++){
  let energy=0;
  for(let i=0;i<n;i++)if((mask>>>i)&1)for(let j=0;j<n;j++)if((mask>>>j)&1)energy+=matrix[i][j];
  if(energy<bestEnergy){bestEnergy=energy;bestBits=Array.from({length:n},(_,i)=>(mask>>>i)&1);}
 }
 return {bits:bestBits,energy:bestEnergy,method:'exhaustive-exact',candidates};
}
