(() => {
 const section=document.querySelector('#members');
 const art=section?.querySelector('.member-art');
 if(!art)return;
 window.membersMarkerAutoStart=false;
 const canvas=document.createElement('canvas');
 canvas.id='marker-canvas';canvas.width=1200;canvas.height=673;
 canvas.setAttribute('role','img');
 canvas.setAttribute('aria-label','緑のマーカーで3つの曲線が描かれ、メンバーの名前と3つの点が現れます');
 art.append(canvas);
 const guides=document.createElementNS('http://www.w3.org/2000/svg','svg');
 guides.setAttribute('class','marker-path-source');
 guides.setAttribute('viewBox','0 0 1675 939');
 guides.setAttribute('aria-hidden','true');
 const routes=[
  [0,true,'M253 368 C340 265 460 155 573 145 C698 110 837 174 898 295'],
  [0,false,'M297 418 C390 315 494 233 581 230 C652 211 699 222 738 244'],
  [0,false,'M444 403 C502 345 561 309 628 310'],
  [0,false,'M799 315 C707 353 603 456 525 563 C459 661 442 758 476 823 C531 851 633 808 719 755'],
  [0,false,'M753 446 C681 488 607 572 557 655 C539 720 570 749 642 741 C724 718 788 608 808 505 C819 447 820 398 815 364'],
  [0,false,'M909 331 C936 428 920 549 867 641 C837 683 784 724 743 748'],
  [1,true,'M941 288 C1059 264 1167 308 1251 365'],
  [1,false,'M948 351 C1047 343 1118 365 1170 401'],
  [1,false,'M1502 444 C1373 394 1239 405 1138 454 C1033 501 957 651 962 755 C954 838 1012 876 1087 867'],
  [1,false,'M1129 577 C1168 520 1201 489 1239 490 C1274 541 1262 701 1210 765 C1153 840 1077 820 1059 746 C1039 686 1082 615 1129 577'],
  [2,true,'M1306 485 C1349 565 1359 656 1315 740 C1285 797 1214 846 1133 865'],
  [2,false,'M1361 482 C1445 489 1514 537 1553 574'],
  [2,false,'M1401 559 C1487 569 1560 612 1615 654']
 ];
 for(const [group,primary,d] of routes){
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.classList.add('name-route');path.dataset.group=String(group);
  if(primary)path.dataset.primary='true';
  path.setAttribute('d',d);guides.append(path);
 }
 section.append(guides);
 window.addEventListener('members-marker-ready',()=>{
  const marker=window.membersMarkerPrototype;
 if(marker?.canvas!==canvas)return;
  art.classList.add('marker-ready');
 });
})();
