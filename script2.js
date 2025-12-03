// script.js
// Core interactions: nav slide, hero shrink on scroll, shorts auto-scroll + manual scroll,
// stagger reveal for long videos, thumbs continuous loops, overlay menu, custom cursor, scroll-to-top.

// DOM refs
const nav = document.getElementById('nav');
const videoWrap = document.getElementById('mainVideoWrap');
const shortsTrack = document.getElementById('shortsTrack');
const shortsWrap = document.getElementById('shortsWrap');
const shortItems = Array.from(document.querySelectorAll('.short-item'));
const longItems = Array.from(document.querySelectorAll('.card-item'));
const thumbTopTrack = document.querySelector('#thumbTop .thumb-track');
const thumbBottomTrack = document.querySelector('#thumbBottom .thumb-track');
const menuBtn = document.getElementById('menuBtn');
const overlay = document.getElementById('overlay');
const overlayClose = document.getElementById('overlayClose');
const cursor = document.getElementById('cursor');
const toTop = document.getElementById('toTop');
const yearSpan = document.getElementById('year');

// initial year
if(yearSpan) yearSpan.textContent = new Date().getFullYear();

// 1) Show nav with slide when page loads
window.addEventListener('load', () => {
  setTimeout(()=> nav.classList.add('show'), 120);
});

// 2) Custom cursor
document.addEventListener('mousemove', (e) => {
  cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
});

// 3) Overlay menu open/close
menuBtn.addEventListener('click', ()=> overlay.classList.add('show'));
overlayClose.addEventListener('click', ()=> overlay.classList.remove('show'));
overlay.addEventListener('click', (e) => { if(e.target === overlay) overlay.classList.remove('show') });

// 4) Shrink main video when user scrolls down past hero threshold
const shrinkThreshold = 220;
let shrunk = false;
window.addEventListener('scroll', () => {
  const sc = window.scrollY;
  // make nav subtle on scroll
  if(sc>30) nav.style.backdropFilter = 'blur(16px) saturate(120%)';

  if(sc > shrinkThreshold && !shrunk && window.innerWidth>560){
    videoWrap.classList.add('shrink');
    shrunk = true;
  } else if(sc <= shrinkThreshold && shrunk){
    videoWrap.classList.remove('shrink');
    shrunk = false;
  }

  // show scroll-to-top
  if(sc > 600) toTop.style.display = 'flex'; else toTop.style.display = 'none';
});

// scroll-to-top
toTop.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));

// 5) Shorts INFINITE CONTINUOUS auto-scroll using TRANSFORM (most reliable)
let shortsSpeed = 0.6; // px per frame
let shortsPaused = false;
let manualScrollTimeout;
let isManualScrolling = false;
let isDragging = false;
let translateX = 0;
let shortsOriginalWidth = 0;

// Measure original shorts width (first 5 items)
function measureOriginalWidth() {
  if(!shortsTrack) return 0;
  const originalItems = Array.from(shortsTrack.querySelectorAll('.short-item:not(.clone)')).slice(0, 5);
  let width = 0;
  originalItems.forEach(item => {
    width += item.offsetWidth + 14; // 14px gap
  });
  return width;
}

// Wait for DOM to be ready
setTimeout(() => {
  shortsOriginalWidth = measureOriginalWidth();
  console.log('Shorts original width:', shortsOriginalWidth);
}, 100);

// Infinite continuous auto-scroll using transform
function animateShorts(){
  if(!shortsPaused && !isManualScrolling && !isDragging && shortsTrack && shortsOriginalWidth > 0){
    // Move left (negative translateX)
    translateX -= shortsSpeed;
    
    // Reset when we've scrolled one full set
    if(Math.abs(translateX) >= shortsOriginalWidth) {
      translateX = 0; // Seamless reset
    }
    
    // Apply transform
    shortsTrack.style.transform = `translateX(${translateX}px)`;
  }
  requestAnimationFrame(animateShorts);
}

// Start infinite continuous auto-scroll
requestAnimationFrame(animateShorts);

// Manual scroll detection & controls
if(shortsWrap && shortsTrack) {
  let startX, startTranslateX;

  // Mouse drag scrolling
  shortsWrap.addEventListener('mousedown', (e) => {
    isDragging = true;
    shortsPaused = true;
    isManualScrolling = true;
    shortsWrap.style.cursor = 'grabbing';
    startX = e.pageX;
    startTranslateX = translateX;
    clearTimeout(manualScrollTimeout);
  });

  document.addEventListener('mouseup', () => {
    if(isDragging) {
      isDragging = false;
      shortsWrap.style.cursor = 'grab';
      
      // Resume auto-scroll after 2 seconds
      manualScrollTimeout = setTimeout(() => {
        isManualScrolling = false;
        shortsPaused = false;
      }, 2000);
    }
  });

  shortsWrap.addEventListener('mouseleave', () => {
    if(isDragging) {
      isDragging = false;
      shortsWrap.style.cursor = 'grab';
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const deltaX = e.pageX - startX;
    translateX = startTranslateX + deltaX;
    
    // Keep within bounds for manual dragging
    if(shortsOriginalWidth > 0) {
      if(Math.abs(translateX) >= shortsOriginalWidth) {
        translateX = 0;
      }
      if(translateX > 0) {
        translateX = -(shortsOriginalWidth - 10);
      }
    }
    
    shortsTrack.style.transform = `translateX(${translateX}px)`;
  });
}

// Pause on hover & "play" simulation
shortItems.forEach((el) => {
  el.addEventListener('mouseenter', () => {
    shortsPaused = true;
    el.classList.add('playing');
    // simulate playing by adjusting styles
    const mm = el.querySelector('.short-media');
    if(mm) {
      mm.style.boxShadow = '0 4px 14px rgba(0,0,0,0.06) inset';
      mm.style.transform = 'scale(1.01)';
    }
  });
  el.addEventListener('mouseleave', () => {
    shortsPaused = false;
    el.classList.remove('playing');
    const mm = el.querySelector('.short-media');
    if(mm) {
      mm.style.boxShadow = '';
      mm.style.transform = '';
    }
  });
});

// 6) Stagger reveal for long videos when in viewport
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      const els = Array.from(document.querySelectorAll('.long.card-item'));
      els.forEach((el, i) => {
        setTimeout(()=> el.classList.add('visible'), i*140);
      });
      observer.disconnect();
    }
  });
},{threshold:0.2});
const longsSection = document.querySelector('.longs');
if(longsSection) observer.observe(longsSection);

// 7) Thumbnails continuous slider with seamless infinite loop
let topPos = 0, bottomPos = 0;
const topSpeed = 0.6, bottomSpeed = 0.6;
let last = performance.now();
let topOriginalWidth = 0;
let bottomOriginalWidth = 0;
let topInitialOffset = 0;
let bottomInitialOffset = 0;

// Measure original width for thumb tracks
function measureThumbOriginalWidth(track) {
  if(!track) return 0;
  const originalItems = Array.from(track.querySelectorAll('.thumb:not(.clone)'));
  let width = 0;
  originalItems.forEach(item => {
    width += item.offsetWidth + 14; // 14px gap
  });
  return width;
}

// Measure left clones width
function measureThumbLeftClonesWidth(track) {
  if(!track) return 0;
  const leftClones = Array.from(track.querySelectorAll('.thumb.clone')).slice(0, 2);
  let width = 0;
  leftClones.forEach(item => {
    width += item.offsetWidth + 14;
  });
  return width;
}

// Initialize thumb positions
setTimeout(() => {
  if(thumbTopTrack) {
    topOriginalWidth = measureThumbOriginalWidth(thumbTopTrack);
    topInitialOffset = measureThumbLeftClonesWidth(thumbTopTrack);
    topPos = -topInitialOffset;
    thumbTopTrack.style.transform = `translateX(${topPos}px)`;
    console.log('Top thumb width:', topOriginalWidth, 'offset:', topInitialOffset);
  }
  
  if(thumbBottomTrack) {
    bottomOriginalWidth = measureThumbOriginalWidth(thumbBottomTrack);
    bottomInitialOffset = measureThumbLeftClonesWidth(thumbBottomTrack);
    bottomPos = -bottomInitialOffset;
    thumbBottomTrack.style.transform = `translateX(${bottomPos}px)`;
    console.log('Bottom thumb width:', bottomOriginalWidth, 'offset:', bottomInitialOffset);
  }
}, 100);

function animateThumbs(now){
  const dt = now - last;
  last = now;
  
  // Top row moves left
  if(topOriginalWidth > 0) {
    topPos -= topSpeed * (dt/16);
    
    // Reset when scrolled past one full set to the left
    if(topPos <= -(topInitialOffset + topOriginalWidth)) {
      topPos = -topInitialOffset;
    }
    
    // Reset when scrolled too far right
    if(topPos > -topInitialOffset) {
      topPos = -(topInitialOffset + topOriginalWidth);
    }
    
    if(thumbTopTrack) thumbTopTrack.style.transform = `translateX(${topPos}px)`;
  }
  
  // Bottom row moves right
  if(bottomOriginalWidth > 0) {
    bottomPos += bottomSpeed * (dt/16);
    
    // Reset when scrolled too far right
    if(bottomPos >= -bottomInitialOffset + bottomOriginalWidth) {
      bottomPos = -bottomInitialOffset;
    }
    
    // Reset when scrolled too far left
    if(bottomPos < -(bottomInitialOffset + bottomOriginalWidth)) {
      bottomPos = -bottomInitialOffset;
    }
    
    if(thumbBottomTrack) thumbBottomTrack.style.transform = `translateX(${bottomPos}px)`;
  }

  requestAnimationFrame(animateThumbs);
}
requestAnimationFrame(animateThumbs);

// 8) small hover brightening for cards (already CSS) - additionally pause thumbs on hover
const thumbRows = [document.getElementById('thumbTop'), document.getElementById('thumbBottom')];
thumbRows.forEach(row => {
  if(row) {
    row.addEventListener('mouseenter', () => {
      // slow down when hovered
      const track = row.querySelector('.thumb-track');
      if(track) track.style.transition = 'transform .2s';
    });
    row.addEventListener('mouseleave', () => {
      const track = row.querySelector('.thumb-track');
      if(track) track.style.transition = '';
    });
  }
});

// 9) Keyboard accessibility: pressing "M" opens menu
document.addEventListener('keydown', (e) => {
  if(e.key.toLowerCase() === 'm') overlay.classList.toggle('show');
});

// 10) Touch friendly tweaks for shorts
if(shortsWrap) {
  shortsWrap.style.cursor = 'grab';
  shortsWrap.style.overflowX = 'auto';

  shortsWrap.addEventListener('touchstart', () => {
    shortsPaused = true;
    isManualScrolling = true;
    clearTimeout(manualScrollTimeout);
  }, {passive:true});

  shortsWrap.addEventListener('touchend', () => {
    // Resume after 2 seconds
    manualScrollTimeout = setTimeout(() => {
      isManualScrolling = false;
      shortsPaused = false;
    }, 2000);
  }, {passive:true});
}

// 11) smooth anchor scrolling for nav links
document.querySelectorAll('.nav-center a, .overlay-nav a').forEach(a=>{
  a.addEventListener('click', (ev)=>{
    ev.preventDefault();
    const t = a.getAttribute('href');
    if(t && t.startsWith('#')){
      const el = document.querySelector(t);
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
      overlay.classList.remove('show');
    }
  })
});



// shorts loop theek h but esa hona chahiye loop left to right jaa raha h sahi h but right ki aur jaa rha h to left area khali nhi hona
// chahiye aage wale shorts epeechhe se fir se continuos hi rehna chahiy