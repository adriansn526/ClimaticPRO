'use client';

import { useState, useEffect } from 'react';
import NextImage from 'next/image';

interface ProductDescriptionProps {
  html: string;
}

interface DescriptionImageProps {
  src: string;
  alt: string;
  caption?: string;
}

// Componentă pentru imagini în descriere cu layout responsive și poziție alternativă
function DescriptionImage({ src, alt, caption, position = 'center' }: DescriptionImageProps & { position?: 'left' | 'right' | 'center' }) {
  const positionClasses = {
    left: 'lg:float-left lg:mr-8 lg:mb-6 lg:w-[48%]',
    right: 'lg:float-right lg:ml-8 lg:mb-6 lg:w-[48%]',
    center: 'w-full max-w-4xl mx-auto',
  };

  return (
    <figure className={`my-10 not-prose clear-both ${positionClasses[position]}`}>
      <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white">
        <NextImage
          src={src}
          alt={alt}
          fill
          className="object-contain p-6"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 900px"
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="text-sm text-gray-600 mt-3 text-center italic font-medium">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}


// Procesare HTML - toate elementele inline (fără accordion)
function processDescription(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Extrage toate elementele în ordine (H2, H3, P, UL, OL, IMG)
  const contentBlocks: Array<{
    type: 'paragraph' | 'image' | 'h2' | 'h3' | 'list';
    content: string;
    data?: any;
  }> = [];
  
  const bodyChildren = Array.from(doc.body.children);
  
  bodyChildren.forEach((element) => {
    const tagName = element.tagName;
    
    // Imagini
    if (tagName === 'IMG' || (tagName === 'P' && element.querySelector('img'))) {
      const img = tagName === 'IMG' ? element : element.querySelector('img');
      if (img) {
        contentBlocks.push({
          type: 'image',
          content: '',
          data: {
            src: (img as HTMLImageElement).src,
            alt: (img as HTMLImageElement).alt || 'Imagine produs',
            caption: (img as HTMLImageElement).title || '',
          },
        });
      }
      return;
    }
    
    // H2 - heading principal
    if (tagName === 'H2') {
      contentBlocks.push({
        type: 'h2',
        content: element.outerHTML,
      });
      return;
    }
    
    // H3 - subheading
    if (tagName === 'H3') {
      contentBlocks.push({
        type: 'h3',
        content: element.outerHTML,
      });
      return;
    }
    
    // Liste (UL, OL)
    if (tagName === 'UL' || tagName === 'OL') {
      contentBlocks.push({
        type: 'list',
        content: element.outerHTML,
      });
      return;
    }
    
    // Paragrafe și alte elemente
    if (tagName === 'P' || tagName === 'DIV') {
      const textContent = element.textContent?.trim();
      if (textContent && textContent.length > 0) {
        contentBlocks.push({
          type: 'paragraph',
          content: element.outerHTML,
        });
      }
    }
  });
  
  return {
    contentBlocks,
  };
}

export default function ProductDescription({ html }: ProductDescriptionProps) {
  const [processed, setProcessed] = useState<{
    contentBlocks: Array<{
      type: 'paragraph' | 'image' | 'h2' | 'h3' | 'list';
      content: string;
      data?: any;
    }>;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const result = processDescription(html);
    setProcessed(result);
  }, [html]);

  // Afișează HTML raw până când componenta este montată și procesată
  if (!isMounted || !processed) {
    return (
      <div 
        className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Grupare imagini consecutive
  const groupedBlocks: Array<{
    type: 'single' | 'image-group';
    blocks: typeof processed.contentBlocks;
  }> = [];
  
  let currentImageGroup: typeof processed.contentBlocks = [];
  
  processed.contentBlocks.forEach((block, index) => {
    if (block.type === 'image') {
      currentImageGroup.push(block);
    } else {
      // Dacă avem imagini grupate, adaugă grupul
      if (currentImageGroup.length > 0) {
        groupedBlocks.push({
          type: 'image-group',
          blocks: currentImageGroup,
        });
        currentImageGroup = [];
      }
      // Adaugă blocul curent (non-imagine)
      groupedBlocks.push({
        type: 'single',
        blocks: [block],
      });
    }
  });
  
  // Adaugă ultimul grup de imagini dacă există
  if (currentImageGroup.length > 0) {
    groupedBlocks.push({
      type: 'image-group',
      blocks: currentImageGroup,
    });
  }

  // Counter pentru poziția imaginilor (stânga/dreapta alternativ)
  let imageCounter = 0;

  return (
    <div className="prose prose-lg max-w-none">
      {/* Conținut procesat cu grupare imagini */}
      {groupedBlocks.map((group, groupIndex) => {
        // Grup de imagini consecutive - afișează în grid
        if (group.type === 'image-group') {
          // Dacă sunt 2+ imagini consecutive, afișează în grid
          if (group.blocks.length >= 2) {
            return (
              <div key={`group-${groupIndex}`} className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-10 not-prose clear-both">
                {group.blocks.map((block, imgIndex) => (
                  <figure key={`grouped-img-${groupIndex}-${imgIndex}`} className="m-0">
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white">
                      <NextImage
                        src={block.data.src}
                        alt={block.data.alt}
                        fill
                        className="object-contain p-6"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 48vw, 650px"
                        loading="lazy"
                      />
                    </div>
                    {block.data.caption && (
                      <figcaption className="text-sm text-gray-600 mt-3 text-center italic font-medium">
                        {block.data.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            );
          }
          
          // O singură imagine - aliniere center (nu float)
          const block = group.blocks[0];
          return (
            <DescriptionImage
              key={`single-img-${groupIndex}`}
              src={block.data.src}
              alt={block.data.alt}
              caption={block.data.caption}
              position="center"
            />
          );
        }
        
        // Bloc single (non-imagine)
        const block = group.blocks[0];
        
        // H2 - heading principal cu styling special
        if (block.type === 'h2') {
          return (
            <div
              key={`h2-${groupIndex}`}
              className="clear-both mt-12 mb-6 first:mt-0 bg-gradient-to-r from-primary-50 to-blue-50 border-l-4 border-primary-600 rounded-r-lg p-4 lg:p-5"
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 m-0" dangerouslySetInnerHTML={{ __html: block.content.replace(/<\/?h2[^>]*>/g, '') }} />
            </div>
          );
        }
        
        // H3 - subheading cu styling mai simplu
        if (block.type === 'h3') {
          return (
            <div
              key={`h3-${groupIndex}`}
              className="clear-both mt-8 mb-4 border-l-4 border-gray-300 pl-4"
            >
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-800 m-0" dangerouslySetInnerHTML={{ __html: block.content.replace(/<\/?h3[^>]*>/g, '') }} />
            </div>
          );
        }
        
        // Liste - spacing special
        if (block.type === 'list') {
          return (
            <div
              key={`list-${groupIndex}`}
              className="my-6"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          );
        }
        
        // Paragraf - typography optimizată
        return (
          <div
            key={`paragraph-${groupIndex}`}
            className="my-4 text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );
      })}
      
      {/* Clear floats la final */}
      <div className="clear-both" />
    </div>
  );
}
