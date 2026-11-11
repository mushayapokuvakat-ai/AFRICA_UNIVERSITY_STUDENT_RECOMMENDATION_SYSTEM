/* Africa University public portfolio: scroll reveal and smooth in-page navigation (hash links avoided so the app router is untouched) */
(function(){var s=document.getElementById('au-portfolio');if(!s)return;
var els=s.querySelectorAll('.au-r');
if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')})}
else{var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.12});els.forEach(function(e){io.observe(e)})}
s.addEventListener('click',function(e){var b=e.target.closest('[data-au-go]');if(!b)return;e.preventDefault();var id=b.getAttribute('data-au-go');
if(id==='top'){window.scrollTo({top:0,behavior:'smooth'});return}
var t=document.getElementById('au-'+id);if(t)t.scrollIntoView({behavior:'smooth',block:'start'})});
})();
