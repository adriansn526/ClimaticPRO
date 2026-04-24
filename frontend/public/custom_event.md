🛒 Funnel de cumpărare
Eveniment	Când se declanșează
product_viewed	Utilizatorul deschide o pagină de produs
product_added_to_cart	Click pe "Adaugă în coș"
cart_viewed	Utilizatorul deschide coșul
checkout_started	Utilizatorul începe procesul de checkout
order_completed	Comanda a fost finalizată
De ce? Fără acestea nu poți construi un funnel de conversie și nu știi unde se pierd utilizatorii.

🔍 Căutare și filtrare
Eveniment	Proprietăți utile
search_performed	query, results_count
filter_applied	filter_type, filter_value (brand, putere BTU, etc.)
search_result_clicked	product_id, product_name, position
De ce? Înțelegi ce caută utilizatorii și dacă găsesc ce au nevoie.

📄 Pagina de produs
Eveniment	Proprietăți utile
product_gallery_scrolled	product_id
product_specs_expanded	product_id, section_name
product_contact_clicked	product_id (cerere ofertă/telefon)
product_recommended_clicked	product_id, source
📍 Pagina /instalare
Eveniment	Proprietăți utile
installation_anchor_clicked	anchor_id – fix pentru problema identificată!
recommended_devices_viewed	Când secțiunea devine vizibilă în viewport
installation_form_started	Utilizatorul completează un formular de instalare
installation_form_submitted	Formular trimis cu succes
👤 Utilizator
Eveniment	Proprietăți utile
user_registered	source (organic, campaign)
user_logged_in	
newsletter_subscribed	source_page
Cum implementezi
În JavaScript, un custom event în PostHog arată așa:

posthog.capture('product_viewed', {  
    product_id: '123',  
    product_name: 'Gree Pulsar 12000 BTU',  
    category: 'aer conditionat',  
    price: 2499  
})  