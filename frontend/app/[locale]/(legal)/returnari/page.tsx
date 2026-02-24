export default function ReturnariPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Politica de Returnare</h1>

            <div className="prose max-w-none text-gray-700 space-y-4">
                <p>Daca doresti sa returnezi un produs achizitionat on-line de pe climaticpro.ro trebuie sa parcurgi urmatorii pasi:</p>

                <h3 className="text-lg font-semibold mt-4">1. Condiții de returnare</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Să fie în aceeași stare în care l-ai primit și însoțit de toate accesoriile/cadourile cu care a fost livrat;</li>
                    <li>Etichetele echipamentului să fie intacte;</li>
                    <li>Dacă ai achiziționat mai multe produse de același fel și vrei să le returnezi pe toate, asigură-te că doar unul dintre acestea a fost desigilat. Returul celorlaltor produse se acceptă doar dacă sunt sigilate;</li>
                    <li>În cazul acumulatorilor nu se acceptă returul dacă prezintă urme de folosire pe bornele acestora;</li>
                    <li>Nu se acceptă produsele asupra cărora au fost efectuate intervenții neautorizate, prezintă urme de uzură excesivă, zgârieturi, ciobituri, lovituri, șocuri mecanice/electrice.</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4">2. Procedura</h3>
                <p>Înregistrează cererea de retur în maxim 30 de zile de la momentul livrării/ridicării produselor.</p>
                <p>În termen de maxim 14 de zile vei primi banii în contul IBAN completat de tine în cererea de retur.</p>

                <h3 className="text-lg font-semibold mt-4">3. Produse instalate (Aer Condiționat)</h3>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-sm">
                    <p className="font-bold text-orange-800 mb-2">Notă importantă privind aparatele de Aer Condiționat:</p>
                    <ul className="list-disc pl-5 space-y-1 text-orange-900">
                        <li><strong>Serviciul de instalare</strong>, odată efectuat, este exceptat de la dreptul de retragere conform OUG 34/2014 (furnizarea de servicii complet prestate). Contravaloarea instalării nu se returnează.</li>
                        <li><strong>Echipamentele instalate</strong> nu mai pot fi returnate ca produse noi (sigilate). Dacă doriți returul unui aparat deja montat (din motive ce nu țin de garanție/defecte), se va percepe o taxă de aducere la conformitate (diminuare a valorii) care poate varia în funcție de starea produsului după demontare.</li>
                        <li>Recomandăm verificarea produsului înainte de instalare. Pentru defecte de fabricație constatate după montaj, se aplică procedura de <strong>Garanție</strong> (reparație sau înlocuire gratuită), nu procedura standard de retur.</li>
                    </ul>
                </div>

                <h3 className="text-lg font-semibold mt-4">4. Anularea cererii</h3>
                <p>Cererea de retur se anulează în următoarele cazuri:</p>
                <ul className="list-disc pl-5">
                    <li>Te-ai răzgândit și nu mai dorești returnarea produsului;</li>
                    <li>Curierul a încercat preluarea de trei ori, dar nu a reușit să ia legătura cu tine.</li>
                </ul>
            </div>
        </div>
    );
}
