/**
 * Global Media & Image Protection Utility
 * 
 * 1. ContextMenu (Sağ Tık) Engeli:
 *    - <img>, <picture>, SVG veya arka plan görseli içeren hiçbir öğede
 *      sağ tık menüsünün açılmasına izin verilmez.
 * 2. Sürükleme (Drag & Drop) Engeli:
 *    - Görsellerin sürüklenip masaüstüne veya yeni sekmeye bırakılmasını
 *      e.preventDefault() ile yakalama (capture) aşamasında engeller.
 *    - Tüm <img> etiketlerine draggable="false" özelliğini dinamik uygular.
 * 3. Dinamik İçerik Koruması:
 *    - Supabase veya harici kaynaklardan sonradan yüklenen ekipman fotoğraflarını
 *      MutationObserver ile anında koruma altına alır.
 */

export function initMediaProtection(): () => void {
  // 1. Sürükleme ve Kaydetme Engeli
  const handleDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    if (
      target.tagName === 'IMG' ||
      target.tagName === 'PICTURE' ||
      target.closest('img') ||
      target.closest('picture') ||
      target.closest('[class*="aspect-"]') ||
      target.classList.contains('protected-image') ||
      target.getAttribute('draggable') === 'false'
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  // 2. Sağ Tık (ContextMenu) Menüsü Engeli
  const handleContextMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Hedef veya ebeveyn bir görsel ya da görsel kapsayıcısı mı?
    const isImageTarget =
      target.tagName === 'IMG' ||
      target.tagName === 'PICTURE' ||
      target.closest('img') ||
      target.closest('picture') ||
      target.closest('[class*="aspect-"]') ||
      target.closest('[data-protected-image]') ||
      target.classList.contains('protected-image') ||
      target.querySelector('img') !== null;

    if (isImageTarget) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // CSS background-image kontrolü
    try {
      const bgImage = window.getComputedStyle(target).backgroundImage;
      if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    } catch {
      // ignore
    }
  };

  // 3. Tüm görsellere draggable="false" ata ve contextmenu engelle
  const applyDraggableFalse = () => {
    if (typeof document === 'undefined') return;
    const images = document.querySelectorAll<HTMLImageElement>('img');
    images.forEach((img) => {
      if (img.getAttribute('draggable') !== 'false') {
        img.setAttribute('draggable', 'false');
      }
      if (!img.getAttribute('oncontextmenu')) {
        img.setAttribute('oncontextmenu', 'return false;');
      }
    });
  };

  // İlk çalıştırma
  applyDraggableFalse();

  // Sonradan gelen dinamik görseller (örn. Supabase ekipman listesi) için MutationObserver
  let observer: MutationObserver | null = null;
  if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined' && document.body) {
    observer = new MutationObserver(() => {
      applyDraggableFalse();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Capturing aşamasında dinle (hiçbir alt öğe stopPropagation ile engelleyemez)
  document.addEventListener('dragstart', handleDragStart, { capture: true });
  document.addEventListener('contextmenu', handleContextMenu, { capture: true });

  return () => {
    document.removeEventListener('dragstart', handleDragStart, { capture: true });
    document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    if (observer) {
      observer.disconnect();
    }
  };
}
