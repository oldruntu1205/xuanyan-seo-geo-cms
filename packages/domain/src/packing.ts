// Carton packing maths for foreign-trade quotations.
// Pure functions with no database access, so the API and the verification scripts
// always produce the same numbers from the same inputs.

export type PackingSpec={
  cartonQuantity:number|null;
  cartonLengthMm:number|null;
  cartonWidthMm:number|null;
  cartonHeightMm:number|null;
  grossWeightKg:number|null;
};

// Nominal internal volume and maximum cargo weight of the common dry containers.
// Reference values for estimation only: real limits depend on the carrier, the route
// and the chassis, and must be confirmed with the forwarder before quoting.
export type ContainerType={code:'20GP'|'40GP'|'40HQ';innerVolumeCbm:number;maxPayloadKg:number};
export const CONTAINER_TYPES:ContainerType[]=[
  {code:'20GP',innerVolumeCbm:33.2,maxPayloadKg:21700},
  {code:'40GP',innerVolumeCbm:67.7,maxPayloadKg:26500},
  {code:'40HQ',innerVolumeCbm:76.4,maxPayloadKg:26500}
];

// Cartons never fill a container completely. 85% is the middle of the usual 80–90%
// range; callers may override it and the UI must always show which factor was used.
export const DEFAULT_LOAD_FACTOR=0.85;

export type ContainerLoading={
  code:string;
  boxes:number|null;
  limitedBy:'volume'|'weight';
  volumeCbm:number|null;
  payloadKg:number|null;
};
export type PackingSummary={
  complete:boolean;
  cartonVolumeCbm:number|null;
  unitVolumeCbm:number|null;
  grossWeightPerBoxKg:number|null;
  containers:ContainerLoading[];
  notes:string[];
};

function positive(...values:(number|null)[]):boolean{
  return values.every(value=>typeof value==='number'&&Number.isFinite(value)&&value>0);
}

// node-postgres returns numeric columns as strings, while the API receives JSON numbers.
// Anything that is not a finite positive number counts as "not recorded".
export function packingNumber(value:unknown):number|null{
  const parsed=typeof value==='string'?Number(value.trim()):typeof value==='number'?value:Number.NaN;
  return Number.isFinite(parsed)&&parsed>0?parsed:null;
}

export type PackingRow={
  carton_quantity?:unknown;carton_length_mm?:unknown;carton_width_mm?:unknown;
  carton_height_mm?:unknown;gross_weight_kg?:unknown;
};
export function packingSpecFromRow(row:PackingRow|undefined):PackingSpec{
  return {
    cartonQuantity:packingNumber(row?.carton_quantity),
    cartonLengthMm:packingNumber(row?.carton_length_mm),
    cartonWidthMm:packingNumber(row?.carton_width_mm),
    cartonHeightMm:packingNumber(row?.carton_height_mm),
    grossWeightKg:packingNumber(row?.gross_weight_kg)
  };
}

// The completeness rule, shared by the API and mirrored by the products_carton_dimensions_complete
// database constraint (028): the three carton dimensions are either all filled or all empty, while
// carton_quantity stands alone. A quantity on its own is a real business fact worth recording;
// two of three dimensions is always a half-measure that can never produce a volume.
// Returns a ready-to-show message when the caller must refuse the input, else null.
export function cartonSpecProblem(spec:PackingSpec):string|null{
  const filled=[spec.cartonLengthMm,spec.cartonWidthMm,spec.cartonHeightMm].filter(value=>value!==null).length;
  return filled===0||filled===3?null:'外箱尺寸请填全：长、宽、高需一并填写，或全部留空（每箱数量可以单独填写）。';
}

// Absorbs binary floating point error so an exactly integral quotient is not rounded down a
// whole box. Measured over 22,080 realistic combinations (three container sizes × four load
// factors × carton dimensions), 21 of them need this: a 40HQ at 85% loaded with an
// 850×100×100 mm carton gives 7639.999999999999 in IEEE-754 while the exact decimal is 7640.
function floorBoxes(value:number):number{
  return value<=0?0:Math.floor(value+1e-9);
}

export function packingSummary(spec:PackingSpec,loadFactor=DEFAULT_LOAD_FACTOR):PackingSummary{
  const empty:ContainerLoading[]=CONTAINER_TYPES.map(type=>({code:type.code,boxes:null,limitedBy:'volume',volumeCbm:null,payloadKg:null}));
  if(!positive(spec.cartonQuantity,spec.cartonLengthMm,spec.cartonWidthMm,spec.cartonHeightMm)){
    return {complete:false,cartonVolumeCbm:null,unitVolumeCbm:null,grossWeightPerBoxKg:null,containers:empty,
      notes:['箱规未填全：每箱数量与外箱长宽高需一并填写，或全部留空。未填全时不估算体积。']};
  }
  const cartonVolumeCbm=spec.cartonLengthMm!*spec.cartonWidthMm!*spec.cartonHeightMm!/1_000_000_000;
  const unitVolumeCbm=cartonVolumeCbm/spec.cartonQuantity!;
  const gross=positive(spec.grossWeightKg)?spec.grossWeightKg!:null;
  const notes=[`装柜数按装载效率 ${Math.round(loadFactor*100)}% 估算，实际以船公司配载为准。`];
  if(gross===null)notes.push('未填每箱毛重：装柜数只受容积限制，未计入重量。');
  const containers=CONTAINER_TYPES.map(type=>{
    const byVolume=floorBoxes(type.innerVolumeCbm*loadFactor/cartonVolumeCbm);
    const byWeight=gross===null?Number.POSITIVE_INFINITY:floorBoxes(type.maxPayloadKg/gross);
    const limitedBy=byWeight<byVolume?'weight' as const:'volume' as const;
    const boxes=Math.min(byVolume,byWeight);
    return {code:type.code,boxes,limitedBy,volumeCbm:boxes*cartonVolumeCbm,payloadKg:gross===null?null:boxes*gross};
  });
  return {complete:true,cartonVolumeCbm,unitVolumeCbm,grossWeightPerBoxKg:gross,containers,notes};
}
