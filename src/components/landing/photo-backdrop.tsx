"use client";

import { useState } from "react";
import { backdropPhoto, type PhotoKey } from "@/components/landing/landing-data";

// The colour behind a section: a photo blurred until only its colours are
// left (see .lp-backdrop). A new photo fades in over the last one, which
// stays underneath until the one after, so there's never a gap.
export function PhotoBackdrop({ photo }: { photo: PhotoKey }) {
  const [layers, setLayers] = useState([{ photo, id: 0 }]);
  const top = layers[layers.length - 1];
  if (top.photo !== photo) setLayers([top, { photo, id: top.id + 1 }]);

  return (
    <div aria-hidden="true" className="lp-backdrop">
      {layers.map((layer) => (
        // eslint-disable-next-line @next/next/no-img-element -- a 64px thumbnail from the optimizer already
        <img key={layer.id} src={backdropPhoto(layer.photo)} alt="" />
      ))}
    </div>
  );
}
