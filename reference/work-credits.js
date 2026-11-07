// Add confirmed credits without inventing unpublished work records.
(() => {
 const credits={emojammer:'協力: 東京大学×NTT サステナブルウェルビーイング社会連携講座'};
 for(const work of works){
  const credit=credits[work.title.trim().toLowerCase()];
  if(credit&&!work.description.includes(credit))work.description+='\n\n'+credit;
 }
})();
