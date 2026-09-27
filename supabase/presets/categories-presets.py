"""Generates the categories_presets data migration.

Run `python3 supabase/presets/categories-presets.py` after editing the list;
it rewrites supabase/migrations/20260926220502_categories_presets_data.sql.
To change presets on a project that already has them, pass a new migration
name (`... categories-presets.py 20261001120000_update_presets.sql`); rows
are upserted by key.
Keywords are lower-case words and merchants the parsers match per language.
"""
import json
import sys
from pathlib import Path

LOCALES = ['en', 'de', 'es', 'fr', 'it', 'pt', 'pt-BR']

# key, group, icon, hue, peer average (EUR/month), suggested,
# names per locale, keywords per locale
P = []


def preset(key, group, icon, hue, peer, names, keywords, suggested=False):
    assert set(names) == set(LOCALES), key
    P.append(dict(key=key, group=group, icon=icon, hue=hue, peer=peer, names=names,
                  keywords=keywords, suggested=suggested))


def n(en, de, es, fr, it, pt, pt_br=None):
    return {'en': en, 'de': de, 'es': es, 'fr': fr, 'it': it, 'pt': pt, 'pt-BR': pt_br or pt}


# Food & drink -----------------------------------------------------------------
preset('groceries', 'food', 'basket', 150, 290,
       n('Groceries', 'Lebensmittel', 'Supermercado', 'Courses', 'Spesa', 'Supermercado', 'Mercado'),
       {'en': ['groceries', 'grocery', 'supermarket', 'tesco', 'sainsbury', 'asda', 'aldi', 'lidl', 'walmart', 'whole foods', 'trader joe'],
        'de': ['lebensmittel', 'einkauf', 'supermarkt', 'rewe', 'edeka', 'lidl', 'aldi', 'netto', 'penny', 'kaufland', 'migros', 'coop', 'billa', 'spar', 'denns'],
        'es': ['supermercado', 'compra', 'mercadona', 'carrefour', 'dia', 'lidl', 'alcampo', 'eroski'],
        'fr': ['courses', 'supermarché', 'carrefour', 'leclerc', 'auchan', 'intermarché', 'monoprix', 'franprix', 'lidl'],
        'it': ['spesa', 'supermercato', 'esselunga', 'conad', 'coop', 'carrefour', 'lidl', 'eurospin', 'pam'],
        'pt': ['supermercado', 'compras', 'pingo doce', 'continente', 'lidl', 'minipreço', 'intermarché'],
        'pt-BR': ['mercado', 'supermercado', 'compras', 'pão de açúcar', 'carrefour', 'extra', 'assaí', 'atacadão']},
       suggested=True)
preset('dining', 'food', 'fork-knife', 55, 110,
       n('Eating out', 'Essen gehen', 'Comer fuera', 'Restaurant', 'Mangiare fuori', 'Comer fora'),
       {'en': ['restaurant', 'lunch', 'dinner', 'pizza', 'sushi', 'burger', 'brunch', 'mcdonalds', 'nandos'],
        'de': ['essen', 'mittagessen', 'abendessen', 'restaurant', 'pizza', 'sushi', 'döner', 'burger', 'kantine', 'mensa'],
        'es': ['restaurante', 'comida', 'cena', 'almuerzo', 'menú', 'tapas', 'pizza'],
        'fr': ['restaurant', 'déjeuner', 'dîner', 'resto', 'brasserie', 'pizza', 'kebab'],
        'it': ['ristorante', 'pranzo', 'cena', 'pizzeria', 'trattoria', 'osteria', 'pizza'],
        'pt': ['restaurante', 'almoço', 'jantar', 'tasca', 'pizza', 'francesinha'],
        'pt-BR': ['restaurante', 'almoço', 'jantar', 'lanche', 'pizza', 'rodízio', 'churrascaria']},
       suggested=True)
preset('cafe', 'food', 'coffee', 75, 35,
       n('Café', 'Café', 'Cafetería', 'Café', 'Bar e caffè', 'Café'),
       {'en': ['coffee', 'café', 'cafe', 'latte', 'flat white', 'cappuccino', 'espresso', 'starbucks', 'costa', 'pret', 'bakery'],
        'de': ['kaffee', 'café', 'bäcker', 'bäckerei', 'croissant', 'latte', 'cappuccino', 'tchibo', 'starbucks'],
        'es': ['café', 'cafetería', 'panadería', 'cortado', 'churros', 'starbucks'],
        'fr': ['café', 'boulangerie', 'croissant', 'pain', 'crème', 'starbucks'],
        'it': ['caffè', 'bar', 'cornetto', 'cappuccino', 'espresso', 'pasticceria'],
        'pt': ['café', 'pastelaria', 'pastel de nata', 'galão', 'bica', 'padaria'],
        'pt-BR': ['café', 'cafezinho', 'padaria', 'pão de queijo', 'cafeteria', 'starbucks']},
       suggested=True)
preset('takeaway', 'food', 'moped', 40, 45,
       n('Takeaway & delivery', 'Lieferdienst', 'Comida a domicilio', 'Livraison de repas', 'Consegna a domicilio', 'Entregas de comida', 'Delivery'),
       {'en': ['takeaway', 'delivery', 'deliveroo', 'uber eats', 'just eat', 'doordash', 'grubhub'],
        'de': ['lieferando', 'lieferdienst', 'wolt', 'uber eats', 'bestellung', 'flink', 'gorillas'],
        'es': ['glovo', 'just eat', 'uber eats', 'domicilio', 'pedido'],
        'fr': ['uber eats', 'deliveroo', 'livraison', 'just eat'],
        'it': ['glovo', 'deliveroo', 'just eat', 'consegna', 'asporto'],
        'pt': ['glovo', 'uber eats', 'bolt food', 'entrega'],
        'pt-BR': ['ifood', 'rappi', 'delivery', 'uber eats', 'entrega']})
preset('bars', 'food', 'beer-stein', 25, 60,
       n('Bars & nightlife', 'Bars & Ausgehen', 'Bares y salir', 'Bars & sorties', 'Bar e uscite', 'Bares e saídas', 'Bares e baladas'),
       {'en': ['bar', 'pub', 'beer', 'drinks', 'cocktail', 'wine', 'club'],
        'de': ['bar', 'kneipe', 'bier', 'drinks', 'cocktail', 'wein', 'club', 'späti'],
        'es': ['bar', 'cerveza', 'copas', 'cóctel', 'vino', 'discoteca'],
        'fr': ['bar', 'bière', 'verre', 'cocktail', 'vin', 'boîte'],
        'it': ['aperitivo', 'birra', 'cocktail', 'vino', 'discoteca', 'spritz'],
        'pt': ['bar', 'cerveja', 'imperial', 'copos', 'cocktail', 'vinho', 'discoteca'],
        'pt-BR': ['bar', 'cerveja', 'chopp', 'balada', 'drink', 'vinho', 'boteco']})

# Transport --------------------------------------------------------------------
preset('transport', 'transport', 'car-simple', 255, 60,
       n('Transport', 'Mobilität', 'Transporte', 'Transports', 'Trasporti', 'Transportes'),
       {'en': ['uber', 'bolt', 'taxi', 'bus', 'train', 'tube', 'metro', 'ticket', 'oyster', 'lyft'],
        'de': ['uber', 'bolt', 'taxi', 'bus', 'bahn', 'db', 'bvg', 'mvg', 'hvv', 'ticket', 'deutschlandticket', 'u-bahn', 's-bahn', 'sbb', 'öbb', 'fahrkarte', 'e-scooter', 'tier', 'lime'],
        'es': ['uber', 'cabify', 'taxi', 'metro', 'autobús', 'renfe', 'billete', 'bicing'],
        'fr': ['uber', 'bolt', 'taxi', 'métro', 'ratp', 'sncf', 'navigo', 'bus', 'ticket'],
        'it': ['uber', 'taxi', 'metro', 'autobus', 'atm', 'atac', 'trenitalia', 'italo', 'biglietto'],
        'pt': ['uber', 'bolt', 'táxi', 'metro', 'autocarro', 'cp', 'comboio', 'navegante', 'bilhete'],
        'pt-BR': ['uber', '99', 'táxi', 'metrô', 'ônibus', 'passagem', 'bilhete único']},
       suggested=True)
preset('fuel', 'transport', 'gas-pump', 210, 90,
       n('Fuel & charging', 'Tanken & Laden', 'Gasolina', 'Carburant', 'Carburante', 'Combustível'),
       {'en': ['fuel', 'petrol', 'gas station', 'diesel', 'shell', 'bp', 'esso', 'charging'],
        'de': ['tanken', 'tankstelle', 'benzin', 'diesel', 'aral', 'shell', 'esso', 'jet', 'total', 'ladesäule', 'e-auto laden'],
        'es': ['gasolina', 'gasóleo', 'repsol', 'cepsa', 'bp', 'shell', 'carga'],
        'fr': ['essence', 'carburant', 'gazole', 'total', 'station', 'recharge'],
        'it': ['benzina', 'carburante', 'gasolio', 'eni', 'q8', 'ip', 'distributore', 'ricarica'],
        'pt': ['gasolina', 'gasóleo', 'combustível', 'galp', 'bp', 'repsol', 'carregamento'],
        'pt-BR': ['gasolina', 'etanol', 'combustível', 'posto', 'ipiranga', 'shell', 'petrobras']})
preset('parking', 'transport', 'road-horizon', 240, 20,
       n('Parking & tolls', 'Parken & Maut', 'Parking y peajes', 'Parking & péages', 'Parcheggio e pedaggi', 'Estacionamento e portagens', 'Estacionamento e pedágio'),
       {'en': ['parking', 'toll', 'car park', 'ringgo'],
        'de': ['parken', 'parkhaus', 'parkschein', 'maut', 'vignette', 'easypark'],
        'es': ['parking', 'aparcamiento', 'peaje', 'zona azul'],
        'fr': ['parking', 'stationnement', 'péage', 'horodateur'],
        'it': ['parcheggio', 'pedaggio', 'autostrada', 'strisce blu', 'telepass'],
        'pt': ['estacionamento', 'parque', 'portagem', 'via verde'],
        'pt-BR': ['estacionamento', 'pedágio', 'zona azul', 'sem parar']})
preset('car', 'transport', 'car', 220, 70,
       n('Car & repairs', 'Auto & Werkstatt', 'Coche y taller', 'Voiture & garage', 'Auto e officina', 'Carro e oficina'),
       {'en': ['car', 'mot', 'service', 'repair', 'garage', 'tyres', 'car wash'],
        'de': ['auto', 'werkstatt', 'tüv', 'inspektion', 'reifen', 'waschanlage', 'reparatur', 'kfz'],
        'es': ['coche', 'taller', 'itv', 'neumáticos', 'lavado', 'revisión'],
        'fr': ['voiture', 'garage', 'contrôle technique', 'pneus', 'lavage', 'réparation'],
        'it': ['auto', 'officina', 'revisione', 'gomme', 'autolavaggio', 'tagliando'],
        'pt': ['carro', 'oficina', 'inspeção', 'pneus', 'lavagem', 'revisão'],
        'pt-BR': ['carro', 'oficina', 'revisão', 'pneu', 'lava-jato', 'ipva', 'licenciamento']})

# Housing ----------------------------------------------------------------------
preset('housing', 'housing', 'house-line', 20, 850,
       n('Rent & housing', 'Miete & Wohnen', 'Alquiler y vivienda', 'Loyer & logement', 'Affitto e casa', 'Renda e casa', 'Aluguel e moradia'),
       {'en': ['rent', 'mortgage', 'landlord', 'council tax', 'service charge'],
        'de': ['miete', 'wohnung', 'nebenkosten', 'hausgeld', 'kaution', 'rundfunkbeitrag', 'gez'],
        'es': ['alquiler', 'hipoteca', 'comunidad', 'piso', 'fianza'],
        'fr': ['loyer', 'charges', 'appartement', 'caution', 'syndic'],
        'it': ['affitto', 'mutuo', 'condominio', 'casa', 'cauzione'],
        'pt': ['renda', 'casa', 'condomínio', 'prestação da casa', 'caução'],
        'pt-BR': ['aluguel', 'condomínio', 'iptu', 'financiamento', 'caução']})
preset('utilities', 'housing', 'lightning', 45, 120,
       n('Electricity & gas', 'Strom & Gas', 'Luz y gas', 'Électricité & gaz', 'Luce e gas', 'Luz e gás'),
       {'en': ['electricity', 'gas', 'water', 'energy', 'british gas', 'octopus', 'edf'],
        'de': ['strom', 'gas', 'wasser', 'heizung', 'energie', 'stadtwerke', 'vattenfall', 'eon', 'e.on'],
        'es': ['luz', 'electricidad', 'gas', 'agua', 'iberdrola', 'endesa', 'naturgy'],
        'fr': ['électricité', 'gaz', 'eau', 'edf', 'engie', 'totalenergies'],
        'it': ['luce', 'bolletta', 'gas', 'acqua', 'enel', 'eni', 'a2a', 'hera'],
        'pt': ['luz', 'eletricidade', 'gás', 'água', 'edp', 'galp', 'endesa'],
        'pt-BR': ['luz', 'energia', 'conta de luz', 'gás', 'água', 'enel', 'sabesp', 'cemig']})
preset('internet_phone', 'housing', 'wifi-high', 190, 45,
       n('Internet & phone', 'Internet & Handy', 'Internet y móvil', 'Internet & mobile', 'Internet e telefono', 'Internet e telemóvel', 'Internet e celular'),
       {'en': ['internet', 'broadband', 'phone', 'mobile', 'vodafone', 'ee', 'o2', 'bt', 'verizon', 'at&t'],
        'de': ['internet', 'handy', 'handyvertrag', 'dsl', 'telekom', 'vodafone', 'o2', '1&1', 'swisscom', 'a1'],
        'es': ['internet', 'móvil', 'fibra', 'movistar', 'vodafone', 'orange', 'digi'],
        'fr': ['internet', 'box', 'forfait', 'mobile', 'orange', 'sfr', 'free', 'bouygues'],
        'it': ['internet', 'fibra', 'cellulare', 'ricarica', 'tim', 'vodafone', 'windtre', 'iliad', 'fastweb'],
        'pt': ['internet', 'telemóvel', 'fibra', 'meo', 'nos', 'vodafone'],
        'pt-BR': ['internet', 'celular', 'plano', 'vivo', 'claro', 'tim', 'oi']})
preset('home', 'housing', 'couch', 35, 60,
       n('Home & furniture', 'Haushalt & Einrichtung', 'Hogar y muebles', 'Maison & déco', 'Casa e arredamento', 'Casa e decoração'),
       {'en': ['ikea', 'furniture', 'home', 'cleaning', 'b&q', 'argos', 'homebase'],
        'de': ['ikea', 'möbel', 'haushalt', 'deko', 'obi', 'bauhaus', 'hornbach', 'toom', 'baumarkt', 'putzmittel'],
        'es': ['ikea', 'muebles', 'hogar', 'leroy merlin', 'limpieza', 'decoración'],
        'fr': ['ikea', 'meubles', 'maison', 'leroy merlin', 'castorama', 'déco', 'ménage'],
        'it': ['ikea', 'mobili', 'casa', 'leroy merlin', 'brico', 'pulizie'],
        'pt': ['ikea', 'móveis', 'casa', 'leroy merlin', 'aki', 'decoração', 'limpeza'],
        'pt-BR': ['móveis', 'casa', 'tok&stok', 'leroy merlin', 'decoração', 'limpeza']})

# Shopping ---------------------------------------------------------------------
preset('shopping', 'shopping', 'shopping-bag', 330, 140,
       n('Shopping', 'Shopping', 'Compras', 'Shopping', 'Shopping', 'Compras'),
       {'en': ['shopping', 'amazon', 'ebay', 'online', 'etsy', 'primark'],
        'de': ['shopping', 'amazon', 'ebay', 'online', 'otto', 'tk maxx', 'kaufhaus'],
        'es': ['compras', 'amazon', 'el corte inglés', 'online', 'aliexpress'],
        'fr': ['shopping', 'amazon', 'fnac', 'galeries lafayette', 'cdiscount'],
        'it': ['shopping', 'amazon', 'rinascente', 'online'],
        'pt': ['compras', 'amazon', 'el corte inglés', 'online', 'worten'],
        'pt-BR': ['compras', 'amazon', 'mercado livre', 'shopee', 'shein', 'magalu']},
       suggested=True)
preset('clothing', 'shopping', 't-shirt', 310, 70,
       n('Clothes & shoes', 'Kleidung & Schuhe', 'Ropa y calzado', 'Vêtements & chaussures', 'Abbigliamento e scarpe', 'Roupa e calçado', 'Roupas e calçados'),
       {'en': ['clothes', 'shoes', 'zara', 'h&m', 'uniqlo', 'nike', 'adidas', 'asos', 'next'],
        'de': ['kleidung', 'schuhe', 'zara', 'h&m', 'zalando', 'c&a', 'deichmann', 'about you', 'nike', 'adidas'],
        'es': ['ropa', 'zapatos', 'zara', 'mango', 'pull&bear', 'bershka', 'h&m'],
        'fr': ['vêtements', 'chaussures', 'zara', 'h&m', 'kiabi', 'uniqlo', 'decathlon'],
        'it': ['vestiti', 'scarpe', 'zara', 'h&m', 'ovs', 'calzedonia', 'intimissimi'],
        'pt': ['roupa', 'sapatos', 'zara', 'h&m', 'primark', 'sfera'],
        'pt-BR': ['roupa', 'tênis', 'sapato', 'renner', 'c&a', 'riachuelo', 'zara', 'shein']})
preset('electronics', 'shopping', 'laptop', 260, 40,
       n('Electronics', 'Elektronik', 'Electrónica', 'Électronique', 'Elettronica', 'Eletrónica', 'Eletrônicos'),
       {'en': ['apple', 'currys', 'best buy', 'laptop', 'phone', 'headphones', 'electronics'],
        'de': ['mediamarkt', 'media markt', 'saturn', 'apple', 'cyberport', 'elektronik', 'kopfhörer'],
        'es': ['mediamarkt', 'pccomponentes', 'apple', 'fnac', 'electrónica'],
        'fr': ['fnac', 'darty', 'boulanger', 'apple', 'électronique'],
        'it': ['mediaworld', 'unieuro', 'euronics', 'apple', 'elettronica'],
        'pt': ['worten', 'fnac', 'radio popular', 'apple', 'eletrónica'],
        'pt-BR': ['apple', 'samsung', 'kabum', 'fast shop', 'eletrônico']})
preset('drugstore', 'shopping', 'drop', 320, 45,
       n('Drugstore', 'Drogerie', 'Droguería', 'Droguerie', 'Drogheria', 'Drogaria', 'Farmácia e perfumaria'),
       {'en': ['boots', 'superdrug', 'toiletries', 'cvs', 'walgreens'],
        'de': ['dm', 'rossmann', 'müller', 'drogerie', 'budni', 'zahnpasta', 'shampoo'],
        'es': ['droguería', 'perfumería', 'primor', 'druni', 'champú'],
        'fr': ['droguerie', 'parapharmacie', 'sephora', 'nocibé', 'shampooing'],
        'it': ['drogheria', 'acqua & sapone', 'tigotà', 'shampoo'],
        'pt': ['drogaria', 'perfumaria', 'wells', 'champô'],
        'pt-BR': ['drogaria', 'drogasil', 'raia', 'pague menos', 'perfumaria', 'xampu']})
preset('gifts', 'shopping', 'gift', 350, 30,
       n('Gifts', 'Geschenke', 'Regalos', 'Cadeaux', 'Regali', 'Presentes'),
       {'en': ['gift', 'present', 'birthday', 'flowers'],
        'de': ['geschenk', 'geburtstag', 'blumen', 'mitbringsel'],
        'es': ['regalo', 'cumpleaños', 'flores'],
        'fr': ['cadeau', 'anniversaire', 'fleurs'],
        'it': ['regalo', 'compleanno', 'fiori'],
        'pt': ['presente', 'prenda', 'aniversário', 'flores'],
        'pt-BR': ['presente', 'aniversário', 'flores', 'lembrancinha']})

# Health & body ----------------------------------------------------------------
preset('health', 'health', 'first-aid', 20, 40,
       n('Health & pharmacy', 'Gesundheit & Apotheke', 'Salud y farmacia', 'Santé & pharmacie', 'Salute e farmacia', 'Saúde e farmácia'),
       {'en': ['pharmacy', 'doctor', 'dentist', 'medicine', 'prescription', 'optician', 'hospital'],
        'de': ['apotheke', 'arzt', 'zahnarzt', 'medikament', 'rezept', 'optiker', 'physio', 'krankenhaus'],
        'es': ['farmacia', 'médico', 'dentista', 'medicamento', 'óptica', 'fisio'],
        'fr': ['pharmacie', 'médecin', 'dentiste', 'médicament', 'opticien', 'kiné'],
        'it': ['farmacia', 'medico', 'dentista', 'farmaco', 'ottico', 'ticket sanitario'],
        'pt': ['farmácia', 'médico', 'dentista', 'medicamento', 'óculos', 'fisioterapia'],
        'pt-BR': ['farmácia', 'médico', 'dentista', 'remédio', 'consulta', 'exame', 'plano de saúde']})
preset('fitness', 'health', 'barbell', 180, 35,
       n('Fitness & sports', 'Fitness & Sport', 'Deporte y gimnasio', 'Sport & fitness', 'Sport e palestra', 'Desporto e ginásio', 'Esporte e academia'),
       {'en': ['gym', 'fitness', 'yoga', 'sports', 'puregym', 'swimming', 'decathlon'],
        'de': ['fitness', 'fitnessstudio', 'gym', 'mcfit', 'urban sports', 'yoga', 'schwimmbad', 'verein', 'decathlon'],
        'es': ['gimnasio', 'gym', 'yoga', 'deporte', 'piscina', 'decathlon'],
        'fr': ['salle de sport', 'fitness', 'basic-fit', 'yoga', 'piscine', 'decathlon'],
        'it': ['palestra', 'fitness', 'yoga', 'piscina', 'sport', 'decathlon'],
        'pt': ['ginásio', 'fitness', 'yoga', 'piscina', 'desporto', 'decathlon'],
        'pt-BR': ['academia', 'smart fit', 'yoga', 'pilates', 'natação', 'esporte']})
preset('beauty', 'health', 'scissors', 300, 30,
       n('Hair & beauty', 'Friseur & Beauty', 'Peluquería y belleza', 'Coiffeur & beauté', 'Parrucchiere e bellezza', 'Cabeleireiro e beleza', 'Salão e beleza'),
       {'en': ['hairdresser', 'barber', 'haircut', 'nails', 'beauty', 'cosmetics', 'sephora'],
        'de': ['friseur', 'barbier', 'haarschnitt', 'nagelstudio', 'kosmetik', 'douglas', 'sephora'],
        'es': ['peluquería', 'barbería', 'uñas', 'estética', 'sephora'],
        'fr': ['coiffeur', 'barbier', 'ongles', 'esthétique', 'sephora'],
        'it': ['parrucchiere', 'barbiere', 'unghie', 'estetista', 'sephora'],
        'pt': ['cabeleireiro', 'barbeiro', 'unhas', 'estética', 'sephora'],
        'pt-BR': ['salão', 'cabeleireiro', 'barbearia', 'manicure', 'estética']})

# Leisure ----------------------------------------------------------------------
preset('leisure', 'leisure', 'ticket', 280, 80,
       n('Leisure', 'Freizeit', 'Ocio', 'Loisirs', 'Tempo libero', 'Lazer'),
       {'en': ['cinema', 'movies', 'museum', 'zoo', 'bowling', 'tickets'],
        'de': ['kino', 'museum', 'zoo', 'freizeitpark', 'bowling', 'ausflug', 'eintritt'],
        'es': ['cine', 'museo', 'zoo', 'entradas', 'ocio'],
        'fr': ['cinéma', 'musée', 'zoo', 'sortie', 'billets'],
        'it': ['cinema', 'museo', 'zoo', 'biglietti', 'gita'],
        'pt': ['cinema', 'museu', 'zoo', 'bilhetes', 'passeio'],
        'pt-BR': ['cinema', 'museu', 'zoológico', 'ingresso', 'passeio']})
preset('subscriptions', 'leisure', 'play-circle', 270, 30,
       n('Subscriptions & streaming', 'Abos & Streaming', 'Suscripciones y streaming', 'Abonnements & streaming', 'Abbonamenti e streaming', 'Subscrições e streaming', 'Assinaturas e streaming'),
       {'en': ['netflix', 'spotify', 'disney+', 'prime', 'youtube premium', 'apple music', 'icloud', 'subscription', 'chatgpt'],
        'de': ['netflix', 'spotify', 'disney+', 'prime', 'dazn', 'wow', 'abo', 'icloud', 'apple music', 'youtube premium'],
        'es': ['netflix', 'spotify', 'disney+', 'hbo', 'movistar+', 'suscripción', 'icloud'],
        'fr': ['netflix', 'spotify', 'disney+', 'canal+', 'deezer', 'abonnement', 'icloud'],
        'it': ['netflix', 'spotify', 'disney+', 'dazn', 'sky', 'abbonamento', 'icloud'],
        'pt': ['netflix', 'spotify', 'disney+', 'hbo', 'subscrição', 'icloud'],
        'pt-BR': ['netflix', 'spotify', 'disney+', 'globoplay', 'max', 'assinatura', 'icloud']})
preset('events', 'leisure', 'music-notes', 290, 30,
       n('Concerts & events', 'Konzerte & Events', 'Conciertos y eventos', 'Concerts & événements', 'Concerti ed eventi', 'Concertos e eventos', 'Shows e eventos'),
       {'en': ['concert', 'festival', 'theatre', 'gig', 'ticketmaster', 'eventbrite'],
        'de': ['konzert', 'festival', 'theater', 'eventim', 'oper', 'party'],
        'es': ['concierto', 'festival', 'teatro', 'entradas', 'ticketmaster'],
        'fr': ['concert', 'festival', 'théâtre', 'spectacle', 'fnac spectacles'],
        'it': ['concerto', 'festival', 'teatro', 'ticketone', 'spettacolo'],
        'pt': ['concerto', 'festival', 'teatro', 'espetáculo', 'bol'],
        'pt-BR': ['show', 'festival', 'teatro', 'ingresso', 'sympla']})
preset('hobbies', 'leisure', 'palette', 300, 30,
       n('Hobbies', 'Hobbys', 'Aficiones', 'Loisirs créatifs', 'Hobby', 'Passatempos', 'Hobbies'),
       {'en': ['hobby', 'craft', 'music lesson', 'photography', 'garden'],
        'de': ['hobby', 'basteln', 'musikunterricht', 'fotografie', 'garten', 'modellbau'],
        'es': ['afición', 'manualidades', 'clases de música', 'fotografía', 'jardín'],
        'fr': ['loisir', 'bricolage', 'cours de musique', 'photographie', 'jardin'],
        'it': ['hobby', 'fai da te', 'lezione di musica', 'fotografia', 'giardino'],
        'pt': ['passatempo', 'artesanato', 'aula de música', 'fotografia', 'jardim'],
        'pt-BR': ['hobby', 'artesanato', 'aula de música', 'fotografia', 'jardim']})
preset('books', 'leisure', 'books', 30, 15,
       n('Books & media', 'Bücher & Medien', 'Libros y medios', 'Livres & médias', 'Libri e media', 'Livros e media', 'Livros e mídia'),
       {'en': ['book', 'books', 'kindle', 'audible', 'newspaper', 'magazine', 'waterstones'],
        'de': ['buch', 'bücher', 'thalia', 'hugendubel', 'kindle', 'audible', 'zeitung', 'zeitschrift'],
        'es': ['libro', 'libros', 'casa del libro', 'kindle', 'periódico', 'revista'],
        'fr': ['livre', 'livres', 'fnac', 'kindle', 'journal', 'magazine'],
        'it': ['libro', 'libri', 'feltrinelli', 'mondadori', 'kindle', 'giornale'],
        'pt': ['livro', 'livros', 'bertrand', 'fnac', 'kindle', 'jornal'],
        'pt-BR': ['livro', 'livros', 'livraria', 'kindle', 'jornal', 'revista']})
preset('games', 'leisure', 'game-controller', 250, 15,
       n('Games', 'Games', 'Videojuegos', 'Jeux vidéo', 'Videogiochi', 'Videojogos', 'Games'),
       {'en': ['steam', 'playstation', 'xbox', 'nintendo', 'game', 'games'],
        'de': ['steam', 'playstation', 'xbox', 'nintendo', 'spiel', 'games'],
        'es': ['steam', 'playstation', 'xbox', 'nintendo', 'videojuego'],
        'fr': ['steam', 'playstation', 'xbox', 'nintendo', 'jeu vidéo'],
        'it': ['steam', 'playstation', 'xbox', 'nintendo', 'videogioco'],
        'pt': ['steam', 'playstation', 'xbox', 'nintendo', 'jogo'],
        'pt-BR': ['steam', 'playstation', 'xbox', 'nintendo', 'jogo', 'game']})

# Travel -----------------------------------------------------------------------
preset('travel', 'travel', 'airplane-tilt', 230, 100,
       n('Travel', 'Reisen', 'Viajes', 'Voyages', 'Viaggi', 'Viagens'),
       {'en': ['flight', 'flights', 'holiday', 'trip', 'ryanair', 'easyjet', 'airline', 'booking'],
        'de': ['flug', 'flüge', 'urlaub', 'reise', 'lufthansa', 'ryanair', 'eurowings', 'easyjet', 'mietwagen'],
        'es': ['vuelo', 'vuelos', 'viaje', 'vacaciones', 'iberia', 'vueling', 'ryanair'],
        'fr': ['vol', 'vols', 'voyage', 'vacances', 'air france', 'easyjet', 'ryanair'],
        'it': ['volo', 'voli', 'viaggio', 'vacanza', 'ita airways', 'ryanair', 'easyjet'],
        'pt': ['voo', 'voos', 'viagem', 'férias', 'tap', 'ryanair', 'easyjet'],
        'pt-BR': ['voo', 'passagem aérea', 'viagem', 'férias', 'latam', 'gol', 'azul']})
preset('hotels', 'travel', 'bed', 235, 50,
       n('Hotels & stays', 'Hotels & Unterkünfte', 'Hoteles y alojamiento', 'Hôtels & hébergement', 'Hotel e alloggi', 'Hotéis e alojamento', 'Hotéis e hospedagem'),
       {'en': ['hotel', 'airbnb', 'booking.com', 'hostel', 'accommodation'],
        'de': ['hotel', 'airbnb', 'booking', 'hostel', 'unterkunft', 'ferienwohnung', 'pension'],
        'es': ['hotel', 'airbnb', 'booking', 'hostal', 'alojamiento'],
        'fr': ['hôtel', 'airbnb', 'booking', 'auberge', 'hébergement', 'gîte'],
        'it': ['hotel', 'airbnb', 'booking', 'ostello', 'alloggio', 'b&b'],
        'pt': ['hotel', 'airbnb', 'booking', 'hostel', 'alojamento'],
        'pt-BR': ['hotel', 'airbnb', 'booking', 'pousada', 'hospedagem']})

# Family & pets ----------------------------------------------------------------
preset('kids', 'family', 'baby', 200, 80,
       n('Kids', 'Kinder', 'Hijos', 'Enfants', 'Figli', 'Filhos'),
       {'en': ['kids', 'childcare', 'nursery', 'toys', 'nappies', 'school', 'babysitter'],
        'de': ['kinder', 'kita', 'kindergarten', 'spielzeug', 'windeln', 'schule', 'babysitter', 'taschengeld'],
        'es': ['niños', 'guardería', 'juguetes', 'pañales', 'colegio', 'canguro'],
        'fr': ['enfants', 'crèche', 'jouets', 'couches', 'école', 'nounou'],
        'it': ['bambini', 'asilo', 'giocattoli', 'pannolini', 'scuola', 'babysitter'],
        'pt': ['crianças', 'creche', 'brinquedos', 'fraldas', 'escola', 'ama'],
        'pt-BR': ['filhos', 'creche', 'brinquedos', 'fraldas', 'escola', 'babá']})
preset('pets', 'family', 'paw-print', 30, 40,
       n('Pets', 'Haustiere', 'Mascotas', 'Animaux', 'Animali', 'Animais'),
       {'en': ['pet', 'dog', 'cat', 'vet', 'pets at home', 'pet food'],
        'de': ['haustier', 'hund', 'katze', 'tierarzt', 'fressnapf', 'futter', 'zooplus'],
        'es': ['mascota', 'perro', 'gato', 'veterinario', 'tiendanimal', 'pienso'],
        'fr': ['animal', 'chien', 'chat', 'vétérinaire', 'croquettes', 'maxi zoo'],
        'it': ['animali', 'cane', 'gatto', 'veterinario', 'arcaplanet', 'crocchette'],
        'pt': ['animal', 'cão', 'gato', 'veterinário', 'ração', 'zu'],
        'pt-BR': ['pet', 'cachorro', 'gato', 'veterinário', 'ração', 'petz', 'cobasi']})
preset('education', 'family', 'graduation-cap', 215, 30,
       n('Education & courses', 'Bildung & Kurse', 'Educación y cursos', 'Éducation & cours', 'Istruzione e corsi', 'Educação e cursos'),
       {'en': ['course', 'tuition', 'university', 'udemy', 'coursera', 'language course'],
        'de': ['kurs', 'studium', 'semesterbeitrag', 'uni', 'sprachkurs', 'volkshochschule', 'udemy'],
        'es': ['curso', 'matrícula', 'universidad', 'academia', 'udemy'],
        'fr': ['cours', 'formation', 'université', 'frais de scolarité', 'udemy'],
        'it': ['corso', 'università', 'tasse universitarie', 'lezioni', 'udemy'],
        'pt': ['curso', 'propinas', 'universidade', 'explicações', 'udemy'],
        'pt-BR': ['curso', 'faculdade', 'mensalidade', 'escola de idiomas', 'udemy']})

# Finance ----------------------------------------------------------------------
preset('insurance', 'finance', 'shield-check', 205, 60,
       n('Insurance', 'Versicherungen', 'Seguros', 'Assurances', 'Assicurazioni', 'Seguros'),
       {'en': ['insurance', 'premium', 'aviva', 'axa', 'allianz'],
        'de': ['versicherung', 'haftpflicht', 'hausrat', 'kfz-versicherung', 'krankenkasse', 'allianz', 'huk', 'axa'],
        'es': ['seguro', 'mapfre', 'axa', 'allianz', 'mutua'],
        'fr': ['assurance', 'mutuelle', 'axa', 'maif', 'macif', 'allianz'],
        'it': ['assicurazione', 'generali', 'unipol', 'allianz', 'axa'],
        'pt': ['seguro', 'fidelidade', 'ageas', 'allianz', 'tranquilidade'],
        'pt-BR': ['seguro', 'porto seguro', 'bradesco seguros', 'sulamérica', 'allianz']})
preset('fees', 'finance', 'bank', 215, 10,
       n('Bank fees', 'Bankgebühren', 'Comisiones bancarias', 'Frais bancaires', 'Commissioni bancarie', 'Comissões bancárias', 'Tarifas bancárias'),
       {'en': ['bank fee', 'fee', 'overdraft', 'atm', 'interest'],
        'de': ['kontoführung', 'gebühr', 'bankgebühr', 'dispozinsen', 'kreditkartengebühr'],
        'es': ['comisión', 'comisiones', 'cajero', 'intereses'],
        'fr': ['frais bancaires', 'commission', 'agios', 'frais'],
        'it': ['commissione', 'canone conto', 'interessi', 'bancomat'],
        'pt': ['comissão', 'comissões', 'manutenção de conta', 'juros'],
        'pt-BR': ['tarifa', 'taxa', 'anuidade', 'juros', 'iof']})
preset('taxes', 'finance', 'receipt', 0, 20,
       n('Taxes', 'Steuern', 'Impuestos', 'Impôts', 'Tasse', 'Impostos'),
       {'en': ['tax', 'taxes', 'hmrc', 'irs', 'fine'],
        'de': ['steuer', 'steuern', 'finanzamt', 'bußgeld', 'hundesteuer'],
        'es': ['impuesto', 'impuestos', 'hacienda', 'multa', 'ibi'],
        'fr': ['impôt', 'impôts', 'taxe', 'amende'],
        'it': ['tasse', 'imposte', 'multa', 'f24', 'imu'],
        'pt': ['imposto', 'impostos', 'finanças', 'multa', 'imi'],
        'pt-BR': ['imposto', 'impostos', 'multa', 'darf', 'receita federal']})
preset('loans', 'finance', 'credit-card', 10, 50,
       n('Loans & instalments', 'Kredite & Raten', 'Préstamos y cuotas', 'Crédits & mensualités', 'Prestiti e rate', 'Créditos e prestações', 'Empréstimos e parcelas'),
       {'en': ['loan', 'instalment', 'klarna', 'credit card', 'repayment'],
        'de': ['kredit', 'rate', 'ratenzahlung', 'klarna', 'darlehen', 'tilgung'],
        'es': ['préstamo', 'cuota', 'crédito', 'klarna', 'plazos'],
        'fr': ['crédit', 'mensualité', 'prêt', 'klarna', 'remboursement'],
        'it': ['prestito', 'rata', 'finanziamento', 'klarna'],
        'pt': ['crédito', 'prestação', 'empréstimo', 'klarna'],
        'pt-BR': ['empréstimo', 'parcela', 'financiamento', 'fatura', 'cartão de crédito']})
preset('donations', 'finance', 'hand-heart', 345, 15,
       n('Donations', 'Spenden', 'Donaciones', 'Dons', 'Donazioni', 'Donativos', 'Doações'),
       {'en': ['donation', 'charity', 'gofundme', 'patreon'],
        'de': ['spende', 'spenden', 'patreon', 'kollekte'],
        'es': ['donación', 'ong', 'caridad'],
        'fr': ['don', 'dons', 'association', 'charité'],
        'it': ['donazione', 'beneficenza', 'onlus'],
        'pt': ['donativo', 'donativos', 'caridade'],
        'pt-BR': ['doação', 'doações', 'vaquinha', 'caridade']})

# Work & other ------------------------------------------------------------------
preset('work', 'work', 'briefcase', 225, 20,
       n('Work & office', 'Arbeit & Büro', 'Trabajo y oficina', 'Travail & bureau', 'Lavoro e ufficio', 'Trabalho e escritório'),
       {'en': ['office', 'work', 'stationery', 'software', 'coworking'],
        'de': ['büro', 'arbeit', 'bürobedarf', 'software', 'coworking', 'dienstreise'],
        'es': ['oficina', 'trabajo', 'papelería', 'software', 'coworking'],
        'fr': ['bureau', 'travail', 'papeterie', 'logiciel', 'coworking'],
        'it': ['ufficio', 'lavoro', 'cancelleria', 'software', 'coworking'],
        'pt': ['escritório', 'trabalho', 'papelaria', 'software', 'coworking'],
        'pt-BR': ['escritório', 'trabalho', 'papelaria', 'software', 'coworking']})
preset('other', 'other', 'dots-three', 220, None,
       n('Other', 'Sonstiges', 'Otros', 'Autres', 'Altro', 'Outros'),
       {locale: [] for locale in LOCALES})


def sql_text(value):
    return "'" + value.replace("'", "''") + "'"


def sql_json(value):
    return sql_text(json.dumps(value, ensure_ascii=False)) + '::jsonb'


rows = []
for index, p in enumerate(P):
    keywords = {locale: p['keywords'].get(locale, []) for locale in LOCALES}
    peer = 'null' if p['peer'] is None else str(p['peer'])
    rows.append(
        f"  ({sql_text(p['key'])}, {sql_text(p['group'])}, {sql_json(p['names'])},\n"
        f"   {sql_json(keywords)},\n"
        f"   {sql_text(p['icon'])}, {p['hue']}, {peer}, {'true' if p['suggested'] else 'false'}, {index})"
    )

header = """-- Generated by supabase/presets/categories-presets.py; edit that file and
-- re-run it instead of changing this migration by hand.
insert into public.categories_presets
  (key, group_key, names, keywords, icon, hue, peer_average, suggested, sort_order)
values
"""
name = sys.argv[1] if len(sys.argv) > 1 else '20260926220502_categories_presets_data.sql'
out = Path(__file__).resolve().parents[1] / 'migrations' / name
upsert = '''on conflict (key) do update set
  group_key = excluded.group_key, names = excluded.names, keywords = excluded.keywords,
  icon = excluded.icon, hue = excluded.hue, peer_average = excluded.peer_average,
  suggested = excluded.suggested, sort_order = excluded.sort_order;
'''
out.write_text(header + ',\n'.join(rows) + '\n' + upsert, encoding='utf-8')
print(f'{len(P)} presets -> {out.name}')
