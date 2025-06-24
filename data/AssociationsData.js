// Liste complète des associations disponibles

export const associationsData = {
  "Populaires": [
    {
      id: '1',
      name: 'FRANCE ASSOS SANTÉ',
      description: 'Union nationale des associations agréées d\'usagers du système de santé',
      longDescription: 'Créée en 2017, France Assos Santé est composée de plus de 84 associations nationales qui agissent pour la défense des droits des malades.',
      categories: ['Santé publique', 'Droits des patients'],
      logoPlaceholder: 'F',
      website: 'https://www.france-assos-sante.org',
      imagePath: require('../assets/images/associations/diabete.webp'),
      logoPath: require('../assets/images/logos/FAS.webp')
    },
    {
      id: '2',
      name: 'AFM-TÉLÉTHON',
      description: 'Association de lutte contre les myopathies et maladies génétiques rares',
      longDescription: 'L\'AFM-Téléthon est une association de patients et de parents de malades, reconnue d\'utilité publique. Grâce au Téléthon, elle finance des projets de recherche sur les maladies génétiques neuromusculaires et rares.',
      categories: ['Maladies rares', 'Recherche médicale'],
      logoPlaceholder: 'A',
      website: 'https://www.afm-telethon.fr',
      imagePath: require('../assets/images/associations/19.webp'),
      logoPath: require('../assets/images/logos/afmt.webp')
    },
    {
      id: '3',
      name: 'LIGUE CONTRE LE CANCER',
      description: 'Premier financeur associatif indépendant de la recherche contre le cancer en France',
      longDescription: 'La Ligue contre le cancer est une organisation non gouvernementale française créée en 1918. Elle a pour mission de promouvoir et financer la recherche contre le cancer, d\'informer et accompagner les malades et leurs proches.',
      categories: ['Cancer', 'Recherche médicale'],
      logoPlaceholder: 'L',
      website: 'https://www.ligue-cancer.net',
      imagePath: require('../assets/images/associations/24.webp'),
      logoPath: require('../assets/images/logos/lcc.webp')
    },
    {
      id: '4',
      name: 'AIDES',
      description: 'Première association française de lutte contre le VIH/sida et les hépatites virales',
      longDescription: 'Créée en 1984, AIDES est une association à but non lucratif déclarée d\'utilité publique qui lutte contre le VIH/sida et les hépatites virales en France.',
      categories: ['VIH/Sida', 'Prévention'],
      logoPlaceholder: 'A',
      website: 'https://www.aides.org',
      imagePath: require('../assets/images/associations/1.webp'),
      logoPath: require('../assets/images/logos/aides.webp')
    },
    {
      id: '5',
      name: 'FRANCE ALZHEIMER',
      description: 'Association nationale qui accompagne les familles touchées par la maladie d\'Alzheimer',
      longDescription: 'Créée en 1985, France Alzheimer est une association nationale de familles qui apporte son soutien à toutes les personnes touchées par la maladie d\'Alzheimer ou par une maladie apparentée.',
      categories: ['Alzheimer', 'Soutien aux aidants'],
      logoPlaceholder: 'F',
      website: 'https://www.francealzheimer.org',
      imagePath: require('../assets/images/associations/18.webp'),
      logoPath: require('../assets/images/logos/fa.webp')
    }
  ],
  "Handicap": [
    {
      id: '6',
      name: 'APF FRANCE HANDICAP',
      description: 'Association défendant et représentant les personnes en situation de handicap et leurs proches',
      longDescription: 'Créée en 1933, APF France handicap est la plus importante organisation française de défense et de représentation des personnes en situation de handicap et de leurs proches.',
      categories: ['Handicap moteur', 'Droits des personnes handicapées'],
      logoPlaceholder: 'A',
      website: 'https://www.apf-francehandicap.org',
      imagePath: require('../assets/images/associations/17.webp'),
      logoPath: require('../assets/images/logos/APF.webp')
    },
    {
      id: '7',
      name: 'UNAPEI',
      description: 'Union nationale des associations de parents de personnes handicapées mentales',
      longDescription: 'L\'Unapei est une fédération d\'associations françaises de représentation et de défense des intérêts des personnes handicapées mentales et de leurs familles.',
      categories: ['Handicap mental', 'Soutien aux familles'],
      logoPlaceholder: 'U',
      website: 'https://www.unapei.org',
      imagePath: require('../assets/images/associations/26.webp'),
      logoPath: require('../assets/images/logos/unapei.webp')
    },
    {
      id: '8',
      name: 'VOIR ENSEMBLE',
      description: 'Association au service des personnes aveugles et malvoyantes',
      longDescription: 'Voir Ensemble est une association qui œuvre depuis 1927 pour l\'autonomie et la pleine citoyenneté des personnes aveugles et malvoyantes avec ou sans handicaps associés.',
      categories: ['Handicap visuel', 'Autonomie'],
      logoPlaceholder: 'V',
      website: 'https://www.voirensemble.asso.fr',
      imagePath: require('../assets/images/associations/6.webp'),
      logoPath: require('../assets/images/logos/ve.webp')
    },
    {
      id: '9',
      name: 'FFAIMC',
      description: 'Fédération Française des Associations d\'Infirmes Moteurs Cérébraux',
      longDescription: 'La FFAIMC, créée en 1992, fédère des associations qui accompagnent les personnes atteintes d\'infirmité motrice cérébrale et polyhandicapées.',
      categories: ['Handicap moteur', 'Infirmité motrice cérébrale'],
      logoPlaceholder: 'F',
      website: 'https://www.ffaimc.org',
      imagePath: require('../assets/images/associations/15.webp'),
      logoPath: require('../assets/images/logos/ffaimc.webp')
    },
    {
      id: '10',
      name: 'AFSEP',
      description: 'Association Française des Sclérosés En Plaques',
      longDescription: 'Fondée en 1962, l\'AFSEP a pour mission d\'aider les personnes atteintes de sclérose en plaques et leurs aidants au quotidien.',
      categories: ['Sclérose en plaques', 'Soutien aux malades'],
      logoPlaceholder: 'A',
      website: 'https://afsep.fr',
      imagePath: require('../assets/images/associations/28.webp'),
      logoPath: require('../assets/images/logos/afsep.webp')
    }
  ],
  "Maladies chroniques": [
    {
      id: '11',
      name: 'FRANCE PARKINSON',
      description: 'Association qui soutient les malades de Parkinson et leurs proches',
      longDescription: 'France Parkinson, créée en 1984, a pour mission d\'apporter un soutien aux malades et à leurs proches, d\'informer sur la maladie et de financer la recherche.',
      categories: ['Parkinson', 'Soutien aux malades'],
      logoPlaceholder: 'F',
      website: 'https://www.franceparkinson.fr',
      imagePath: require('../assets/images/associations/11.webp'),
      logoPath: require('../assets/images/logos/fp.webp')
    },
    {
      id: '12',
      name: 'FNAPSY',
      description: 'Fédération Nationale des Associations d\'usagers en PSYchiatrie',
      longDescription: 'La FNAPSY est une association créée en 1992 qui regroupe des associations d\'usagers de la psychiatrie dans le but de défendre leurs droits et leurs intérêts.',
      categories: ['Santé mentale', 'Droits des patients'],
      logoPlaceholder: 'F',
      website: 'https://fnapsy.org',
      imagePath: require('../assets/images/associations/25.webp'),
      logoPath: require('../assets/images/logos/fnapsy.webp')
    },
    {
      id: '13',
      name: 'AFD',
      description: 'Association Française des Diabétiques',
      longDescription: 'L\'AFD est une association de patients au service des patients diabétiques. Elle a pour mission d\'informer, d\'accompagner et de défendre les plus de 4 millions de patients diabétiques.',
      categories: ['Diabète', 'Information et prévention'],
      logoPlaceholder: 'A',
      website: 'https://www.federationdesdiabetiques.org',
      imagePath: require('../assets/images/associations/diabete.webp'),
      logoPath: require('../assets/images/logos/afd.webp')
    },
    {
      id: '14',
      name: 'ASTHME & ALLERGIES',
      description: 'Association dédiée aux personnes asthmatiques et allergiques',
      longDescription: 'Asthme & Allergies est une association qui informe et soutient les personnes souffrant d\'asthme ou d\'allergies, sensibilise le grand public et représente les patients auprès des autorités.',
      categories: ['Asthme', 'Allergies'],
      logoPlaceholder: 'A',
      website: 'https://asthme-allergies.org',
      imagePath: require('../assets/images/associations/21.webp'),
      logoPath: require('../assets/images/logos/aa.webp')
    },
    {
      id: '15',
      name: 'AFA',
      description: 'Association François Aupetit - maladies inflammatoires chroniques intestinales',
      longDescription: 'L\'AFA est l\'unique organisation française, reconnue d\'utilité publique, à se consacrer aux maladies inflammatoires chroniques intestinales (MICI) : maladie de Crohn et rectocolite hémorragique.',
      categories: ['MICI', 'Maladie de Crohn'],
      logoPlaceholder: 'A',
      website: 'https://www.afa.asso.fr',
      imagePath: require('../assets/images/associations/12.webp'),
      logoPath: require('../assets/images/logos/afa.webp')
    }
  ],
  "Cancer": [
    {
      id: '17',
      name: 'ARC',
      description: 'Fondation pour la recherche sur le cancer',
      longDescription: 'La Fondation ARC pour la recherche sur le cancer soutient et finance la recherche pour guérir les cancers en France. Elle a pour mission de trouver de nouvelles solutions thérapeutiques pour les patients.',
      categories: ['Cancer', 'Recherche médicale'],
      logoPlaceholder: 'A',
      website: 'https://www.fondation-arc.org',
      imagePath: require('../assets/images/associations/4.webp'),
      logoPath: require('../assets/images/logos/arc.webp')
    },
    {
      id: '18',
      name: 'FFCD',
      description: 'Fédération Francophone de Cancérologie Digestive',
      longDescription: 'La FFCD promeut la recherche clinique en cancérologie digestive, forme les professionnels de santé et informe les patients et leurs proches sur les cancers digestifs.',
      categories: ['Cancer digestif', 'Recherche clinique'],
      logoPlaceholder: 'F',
      website: 'https://www.ffcd.fr',
      imagePath: require('../assets/images/associations/19.webp'),
      logoPath: require('../assets/images/logos/ffcd.webp')
    },
    {
      id: '19',
      name: 'HNPCC',
      description: 'Association pour les personnes prédisposées génétiquement au cancer colorectal',
      longDescription: 'L\'association HNPCC aide les personnes touchées par le syndrome de Lynch, une prédisposition génétique au cancer colorectal, et sensibilise à l\'importance du dépistage précoce.',
      categories: ['Cancer colorectal', 'Prédisposition génétique'],
      logoPlaceholder: 'H',
      website: 'https://www.hnpcc-lynch.com',
      imagePath: require('../assets/images/associations/27.webp'),
      logoPath: require('../assets/images/logos/hnpcc.webp')
    }
  ],
  "Santé mentale": [
    {
      id: '20',
      name: 'UNAFAM',
      description: 'Union nationale de familles et amis de personnes malades et/ou handicapées psychiques',
      longDescription: 'L\'UNAFAM accueille, écoute, soutient, forme et accompagne les familles et l\'entourage de personnes vivant avec des troubles psychiques et défend leurs intérêts communs.',
      categories: ['Troubles psychiques', 'Soutien aux familles'],
      logoPlaceholder: 'U',
      website: 'https://www.unafam.org',
      imagePath: require('../assets/images/associations/11.webp'),
      logoPath: require('../assets/images/logos/unafam.webp')
    },
    {
      id: '21',
      name: 'ARGOS 2001',
      description: 'Association d\'aide aux personnes atteintes de troubles bipolaires',
      longDescription: 'ARGOS 2001 a pour but d\'aider les personnes souffrant de troubles bipolaires et leur entourage, en leur offrant écoute, soutien et information sur la maladie et les traitements.',
      categories: ['Troubles bipolaires', 'Entraide'],
      logoPlaceholder: 'A',
      website: 'https://argos2001.net',
      imagePath: require('../assets/images/associations/13.webp'),
      logoPath: require('../assets/images/logos/argos.webp')
    },
    {
      id: '22',
      name: 'SCHIZO ? OUI !',
      description: 'Association de soutien pour les personnes souffrant de schizophrénie',
      longDescription: 'Schizo ? Oui ! est une association qui vise à informer sur la schizophrénie, lutter contre la stigmatisation et accompagner les personnes concernées et leurs proches.',
      categories: ['Schizophrénie', 'Lutte contre la stigmatisation'],
      logoPlaceholder: 'S',
      website: 'https://schizo-oui.com',
      imagePath: require('../assets/images/associations/20.webp'),
      logoPath: require('../assets/images/logos/soui.webp')
    },
    {
      id: '23',
      name: 'FRANCE DÉPRESSION',
      description: 'Association nationale de soutien aux personnes souffrant de dépression',
      longDescription: 'France Dépression, fondée en 1992, est une association qui aide et soutient les personnes souffrant de dépression, de troubles bipolaires et d\'anxiété, ainsi que leurs proches.',
      categories: ['Dépression', 'Anxiété'],
      logoPlaceholder: 'F',
      website: 'https://www.france-depression.org',
      imagePath: require('../assets/images/associations/24.webp'),
      logoPath: require('../assets/images/logos/fd.webp')
    }
  ],
  "Maladies rares": [
    {
      id: '24',
      name: 'ALLIANCE MALADIES RARES',
      description: 'Collectif d\'associations de malades qui soutient les personnes atteintes de maladies rares',
      longDescription: 'L\'Alliance Maladies Rares réunit plus de 230 associations de malades et représente près de 3 millions de personnes concernées par une maladie rare en France.',
      categories: ['Maladies rares', 'Collectif d\'associations'],
      logoPlaceholder: 'A',
      website: 'https://www.alliance-maladies-rares.org',
      imagePath: require('../assets/images/associations/24.webp'),
      logoPath: require('../assets/images/logos/amr.webp')
    },
    {
      id: '25',
      name: 'VAINCRE LA MUCOVISCIDOSE',
      description: 'Association de lutte contre la mucoviscidose',
      longDescription: 'Vaincre la Mucoviscidose accompagne les patients et leur famille dans chaque aspect de leur vie bouleversée par la maladie et finance la recherche pour trouver des traitements.',
      categories: ['Mucoviscidose', 'Recherche médicale'],
      logoPlaceholder: 'V',
      website: 'https://www.vaincrelamuco.org',
      imagePath: require('../assets/images/associations/25.webp'),
      logoPath: require('../assets/images/logos/vlm.webp')
    },
    {
      id: '26',
      name: 'ELA',
      description: 'Association Européenne contre les Leucodystrophies',
      longDescription: 'ELA réunit des familles qui se mobilisent pour vaincre les leucodystrophies, des maladies génétiques qui détruisent la myéline du système nerveux central.',
      categories: ['Leucodystrophies', 'Soutien aux familles'],
      logoPlaceholder: 'E',
      website: 'https://ela-asso.com',
      imagePath: require('../assets/images/associations/18.webp'),
      logoPath: require('../assets/images/logos/ela.webp')
    },
    {
      id: '27',
      name: 'PRADER-WILLI FRANCE',
      description: 'Association dédiée au syndrome de Prader-Willi',
      longDescription: 'Prader-Willi France aide les personnes atteintes du syndrome de Prader-Willi, une maladie génétique rare, et soutient leurs familles.',
      categories: ['Syndrome de Prader-Willi', 'Maladie génétique'],
      logoPlaceholder: 'P',
      website: 'https://www.prader-willi.fr',
      imagePath: require('../assets/images/associations/diabete.webp'),
      logoPath: require('../assets/images/logos/pwf.webp')
    },
    {
      id: '28',
      name: 'SOS HÉPATITES',
      description: 'Fédération d\'associations de lutte contre les hépatites virales',
      longDescription: 'SOS Hépatites est une association qui regroupe des personnes concernées par les hépatites virales, quels que soient le virus et le stade de la maladie.',
      categories: ['Hépatites virales', 'Information et prévention'],
      logoPlaceholder: 'S',
      website: 'https://soshepatites.org',
      imagePath: require('../assets/images/associations/6.webp'),
      logoPath: require('../assets/images/logos/sosh.webp')
    }
  ],
  "Addictions": [
    {
      id: '29',
      name: 'ADDICT\'AIDE',
      description: 'Plateforme d\'information et d\'aide sur les addictions',
      longDescription: 'Addict\'Aide est le portail de référence sur les addictions avec ou sans substance. Il informe, oriente et accompagne les personnes concernées et leur entourage.',
      categories: ['Addictions', 'Information et prévention'],
      logoPlaceholder: 'A',
      website: 'https://www.addictaide.fr',
      imagePath: require('../assets/images/associations/13.webp'),
      logoPath: require('../assets/images/logos/aaf.webp')
    },
    {
      id: '30',
      name: 'ALCOOL ASSISTANCE',
      description: 'Association d\'aide aux personnes en difficulté avec l\'alcool',
      longDescription: 'Alcool Assistance accompagne les personnes et familles confrontées à des problèmes d\'alcool et autres addictions. Elle sensibilise également le grand public aux risques liés à l\'alcool.',
      categories: ['Alcoolisme', 'Soutien aux familles'],
      logoPlaceholder: 'A',
      website: 'https://alcoolassistance.net',
      imagePath: require('../assets/images/associations/diabete.webp'),
      logoPath: require('../assets/images/logos/alcoola.webp')
    },
    {
      id: '31',
      name: 'ADDICTION MÉDITERRANÉE',
      description: 'Association de prévention et de soins en addictologie',
      longDescription: 'Addiction Méditerranée accueille et accompagne les personnes confrontées à des problèmes d\'addiction, avec ou sans substance, et développe des actions de prévention auprès des jeunes.',
      categories: ['Addictologie', 'Prévention jeunesse'],
      logoPlaceholder: 'A',
      website: 'https://www.addiction-mediterranee.fr',
      imagePath: require('../assets/images/associations/11.webp'),
      logoPath: require('../assets/images/logos/am.webp')
    }
  ],
  "Santé publique": [
    {
      id: '32',
      name: 'LE PLANNING FAMILIAL',
      description: 'Mouvement féministe d\'éducation populaire pour l\'égalité femmes/hommes',
      longDescription: 'Le Planning Familial est un mouvement militant qui prend en compte toutes les sexualités, défend le droit à la contraception, à l\'avortement et à l\'éducation à la sexualité.',
      categories: ['Droits sexuels', 'Santé reproductive'],
      logoPlaceholder: 'P',
      website: 'https://www.planning-familial.org',
      imagePath: require('../assets/images/associations/25.webp'),
      logoPath: require('../assets/images/logos/lpf.webp')
    },
    {
      id: '33',
      name: 'SIDACTION',
      description: 'Association de lutte contre le sida',
      longDescription: 'Sidaction a pour objectif le développement de programmes de recherche et d\'aide aux malades du sida, en France et dans les pays en développement.',
      categories: ['VIH/Sida', 'Recherche médicale'],
      logoPlaceholder: 'S',
      website: 'https://www.sidaction.org',
      imagePath: require('../assets/images/associations/23.webp'),
      logoPath: require('../assets/images/logos/default_logo.webp')
    },
    {
      id: '34',
      name: 'CROIX-ROUGE FRANÇAISE',
      description: 'Association humanitaire française fondée en 1864',
      longDescription: 'La Croix-Rouge française est une association d\'aide humanitaire qui a pour objectif de venir en aide aux personnes en difficulté en France et à l\'étranger.',
      categories: ['Aide humanitaire', 'Secourisme'],
      logoPlaceholder: 'C',
      website: 'https://www.croix-rouge.fr',
      imagePath: require('../assets/images/associations/21.webp'),
      logoPath: require('../assets/images/logos/cr.webp')
    },
    {
      id: '35',
      name: 'MÉDECINS DU MONDE',
      description: 'ONG internationale de solidarité médicale',
      longDescription: 'Médecins du Monde est une association de solidarité internationale qui soigne les populations les plus vulnérables et témoigne des entraves à l\'accès aux soins.',
      categories: ['Accès aux soins', 'Solidarité internationale'],
      logoPlaceholder: 'M',
      website: 'https://www.medecinsdumonde.org',
      imagePath: require('../assets/images/associations/5.webp'),
      logoPath: require('../assets/images/logos/mm.webp')
    }
  ],
  "Accompagnement": [
    {
      id: '37',
      name: 'CISS',
      description: 'Collectif Interassociatif Sur la Santé',
      longDescription: 'Le CISS regroupe des associations d\'usagers du système de santé et défend leurs intérêts communs, notamment par des actions de formation, d\'information et de plaidoyer.',
      categories: ['Droits des patients', 'Représentation des usagers'],
      logoPlaceholder: 'C',
      website: 'https://www.leciss.org',
      imagePath: require('../assets/images/associations/18.webp'),
      logoPath: require('../assets/images/logos/ciss.webp')
    },
    {
      id: '38',
      name: 'VMEH',
      description: 'Visite des Malades dans les Établissements Hospitaliers',
      longDescription: 'VMEH est une association de bénévoles qui visitent les personnes hospitalisées ou en EHPAD pour leur apporter présence, écoute et réconfort moral.',
      categories: ['Visite de malades', 'Bénévolat'],
      logoPlaceholder: 'V',
      website: 'https://www.vmeh-national.com',
      imagePath: require('../assets/images/associations/10.webp'),
      logoPath: require('../assets/images/logos/vmeh.webp')
    },
    {
      id: '39',
      name: 'TRANSHÉPATE',
      description: 'Fédération Nationale des Déficients et Transplantés Hépatiques',
      longDescription: 'Transhépate rassemble des personnes transplantées hépatiques, ou en attente de transplantation, ainsi que leurs proches. Elle les informe et les soutient tout au long de leur parcours.',
      categories: ['Transplantation hépatique', 'Entraide'],
      logoPlaceholder: 'T',
      website: 'https://www.transhepate.org',
      imagePath: require('../assets/images/associations/11.webp'),
      logoPath: require('../assets/images/logos/transhepate.webp')
    }
  ],
  "Maladies inflammatoires": [
    {
      id: '40',
      name: 'AAAVAM',
      description: 'Association nationale de défense des intérêts des Victimes d\'accidents des médicaments',
      longDescription: 'AAAVAM est une association qui défend les droits et intérêts des personnes victimes d\'accidents médicamenteux et milite pour une meilleure sécurité des médicaments.',
      categories: ['Accidents médicamenteux', 'Défense des droits'],
      logoPlaceholder: 'A',
      website: 'https://www.aaavam.eu',
      imagePath: require('../assets/images/associations/12.webp'),
      logoPath: require('../assets/images/logos/aaavam.webp')
    },
    {
      id: '41',
      name: 'ACTIONS TRAITEMENTS',
      description: 'Association de patients agréée pour représenter les usagers du système de santé',
      longDescription: 'Actions Traitements est une association qui informe et accompagne les personnes vivant avec le VIH et/ou une hépatite, et défend leurs droits auprès du système de santé.',
      categories: ['VIH/Sida', 'Hépatites', 'Défense des droits'],
      logoPlaceholder: 'A',
      website: 'https://www.actions-traitements.org',
      imagePath: require('../assets/images/associations/2.webp'),
      logoPath: require('../assets/images/logos/at.webp')
    },
    {
      id: '42',
      name: 'AFDE',
      description: 'Association française Des Dysplasies Ectodermiques',
      longDescription: 'L\'AFDE soutient les personnes atteintes de dysplasies ectodermiques, des maladies génétiques rares affectant les tissus d\'origine ectodermique (peau, cheveux, dents, ongles).',
      categories: ['Dysplasie ectodermique', 'Maladie génétique'],
      logoPlaceholder: 'A',
      website: 'https://www.afde.net',
      imagePath: require('../assets/images/associations/15.webp'),
      logoPath: require('../assets/images/logos/afde.webp')
    },
    {
      id: '43',
      name: 'AFDOC',
      description: 'Association française des malades et opérés cardio-vasculaires',
      longDescription: 'L\'AFDOC regroupe des personnes atteintes de maladies cardio-vasculaires ou ayant subi une opération cardiaque. Elle offre soutien, information et défend les droits des patients.',
      categories: ['Maladies cardio-vasculaires', 'Soutien aux opérés'],
      logoPlaceholder: 'A',
      website: 'https://www.afdoc.eu',
      imagePath: require('../assets/images/associations/14.webp'),
      logoPath: require('../assets/images/logos/afdoc.webp')
    },
    {
      id: '44',
      name: 'AFGS',
      description: 'Association française du Gougerot Sjögren et des syndromes secs',
      longDescription: 'L\'AFGS informe et soutient les patients atteints du syndrome de Gougerot Sjögren, une maladie auto-immune caractérisée par des sécheresses oculaire et buccale importantes.',
      categories: ['Gougerot Sjögren', 'Maladie auto-immune'],
      logoPlaceholder: 'A',
      website: 'https://www.afgs-syndromes-secs.org',
      imagePath: require('../assets/images/associations/diabete.webp'),
      logoPath: require('../assets/images/logos/afgs.webp')
    },
    {
      id: '45',
      name: 'AFH',
      description: 'Association française des Hémophiles',
      longDescription: 'L\'AFH représente les personnes atteintes d\'hémophilie et autres troubles de la coagulation. Elle les accompagne dans leurs parcours de soins et défend leurs droits.',
      categories: ['Hémophilie', 'Troubles de la coagulation'],
      logoPlaceholder: 'A',
      website: 'https://afh.asso.fr',
      imagePath: require('../assets/images/associations/29.webp'),
      logoPath: require('../assets/images/logos/afh.webp')
    }
  ],
  "Défense des droits": [
    {
      id: '46',
      name: 'AFPric',
      description: 'Association française des polyarthritiques et des rhumatismes inflammatoires chroniques',
      longDescription: 'L\'AFPric soutient les personnes atteintes de polyarthrite rhumatoïde et autres rhumatismes inflammatoires chroniques. Elle propose information, entraide et défend leurs intérêts.',
      categories: ['Polyarthrite', 'Rhumatismes inflammatoires'],
      logoPlaceholder: 'A',
      website: 'https://www.polyarthrite.org',
      imagePath: require('../assets/images/associations/18.webp'),
      logoPath: require('../assets/images/logos/afpric.webp')
    },
    {
      id: '47',
      name: 'AFRH',
      description: 'Association française pour la Recherche sur l\'Hidronadénite',
      longDescription: 'L\'AFRH informe sur l\'hidrosadénite suppurée, une maladie dermatologique inflammatoire chronique, et soutient la recherche médicale pour mieux comprendre et traiter cette affection.',
      categories: ['Hidrosadénite suppurée', 'Maladie dermatologique'],
      logoPlaceholder: 'A',
      website: 'https://www.afrh.fr',
      imagePath: require('../assets/images/associations/7.webp'),
      logoPath: require('../assets/images/logos/afrh.webp')
    },
    {
      id: '48',
      name: 'AFS',
      description: 'Association France Spondyloarthrites',
      longDescription: 'L\'AFS accompagne les personnes atteintes de spondyloarthrite, une maladie inflammatoire chronique affectant principalement la colonne vertébrale et les articulations.',
      categories: ['Spondyloarthrite', 'Maladie inflammatoire'],
      logoPlaceholder: 'A',
      website: 'https://www.spondylarthrite.org',
      imagePath: require('../assets/images/associations/6.webp'),
      logoPath: require('../assets/images/logos/afs.webp')
    },
    {
      id: '49',
      name: 'AFSA',
      description: 'Association française du Syndrome d\'Angelman',
      longDescription: 'L\'AFSA soutient les familles touchées par le syndrome d\'Angelman, une maladie génétique rare caractérisée par un retard de développement et des troubles neurologiques.',
      categories: ['Syndrome d\'Angelman', 'Maladie génétique'],
      logoPlaceholder: 'A',
      website: 'https://www.angelman-afsa.org',
      imagePath: require('../assets/images/associations/20.webp'),
      logoPath: require('../assets/images/logos/afsa.webp')
    },
    {
      id: '50',
      name: 'AFVD',
      description: 'Association francophone pour vaincre les douleurs',
      longDescription: 'L\'AFVD aide les personnes souffrant de douleurs chroniques, en proposant information, soutien et défense de leurs droits auprès des instances médicales et administratives.',
      categories: ['Douleurs chroniques', 'Soutien aux patients'],
      logoPlaceholder: 'A',
      website: 'https://www.association-afvd.com',
      imagePath: require('../assets/images/associations/28.webp'),
      logoPath: require('../assets/images/logos/afvd.webp')
    }
  ],
  "Maladies spécifiques": [
    {
      id: '51',
      name: 'AFVS',
      description: 'Association des familles victimes du saturnisme',
      longDescription: 'L\'AFVS aide les familles touchées par le saturnisme (intoxication au plomb) et milite pour la prévention de cette maladie liée à l\'habitat insalubre.',
      categories: ['Saturnisme', 'Santé environnementale'],
      logoPlaceholder: 'A',
      website: 'http://www.afvs.net',
      imagePath: require('../assets/images/associations/13.webp'),
      logoPath: require('../assets/images/logos/afvs.webp')
    },
    {
      id: '52',
      name: 'AINP',
      description: 'Association d\'Information sur la Névralgie Pudendale',
      longDescription: 'L\'AINP informe sur la névralgie pudendale, une douleur chronique du nerf pudendal, et soutient les personnes qui en souffrent dans leur parcours médical souvent complexe.',
      categories: ['Névralgie pudendale', 'Douleurs chroniques'],
      logoPlaceholder: 'A',
      website: 'https://www.ainp.fr',
      imagePath: require('../assets/images/associations/29.webp'),
      logoPath: require('../assets/images/logos/ainp.webp')
    },
    {
      id: '53',
      name: 'ALCOOL ECOUTE JOIE & SANTÉ',
      description: 'Association d\'aide aux personnes en difficulté avec l\'alcool',
      longDescription: 'Alcool Ecoute Joie & Santé accompagne les personnes souffrant d\'alcoolisme et leurs proches, en proposant écoute, soutien et activités pour retrouver joie de vivre et santé.',
      categories: ['Alcoolisme', 'Soutien et entraide'],
      logoPlaceholder: 'A',
      website: 'https://alcool-ecoute.fr',
      imagePath: require('../assets/images/associations/11.webp'),
      logoPath: require('../assets/images/logos/ajs.webp')
    },
    {
      id: '54',
      name: 'AMADYS',
      description: 'Association des malades atteints de dystonie',
      longDescription: 'AMADYS aide les personnes atteintes de dystonie, un trouble neurologique du mouvement, et soutient la recherche médicale pour améliorer les traitements de cette pathologie.',
      categories: ['Dystonie', 'Troubles neurologiques'],
      logoPlaceholder: 'A',
      website: 'https://amadys.fr',
      imagePath: require('../assets/images/associations/14.webp'),
      logoPath: require('../assets/images/logos/amadys.webp')
    },
    {
      id: '55',
      name: 'AMALYSTE',
      description: 'Association des victimes des syndromes de Lyell et de Stevens-Johnson',
      longDescription: 'AMALYSTE soutient les victimes des syndromes de Lyell et de Stevens-Johnson, réactions cutanées graves souvent d\'origine médicamenteuse, et sensibilise à ces pathologies rares.',
      categories: ['Syndrome de Lyell', 'Syndrome de Stevens-Johnson'],
      logoPlaceholder: 'A',
      website: 'https://www.amalyste.fr',
      imagePath: require('../assets/images/associations/15.webp'),
      logoPath: require('../assets/images/logos/amalyste.webp')
    }
  ],
  "Associations de patients": [
    {
      id: '56',
      name: 'A.M.I NATIONALE',
      description: 'Association nationale de défense des malades, invalides et handicapés',
      longDescription: 'L\'A.M.I. Nationale défend les droits des personnes malades, invalides et handicapées, les accompagne dans leurs démarches administratives et milite pour une meilleure reconnaissance.',
      categories: ['Défense des droits', 'Handicap', 'Invalidité'],
      logoPlaceholder: 'A',
      website: 'https://www.ami-nationale.com',
      imagePath: require('../assets/images/associations/18.webp'),
      logoPath: require('../assets/images/logos/ami.webp')
    },
    {
      id: '57',
      name: 'ANDAR',
      description: 'Association Nationale de Défense contre l\'Arthrite Rhumatoïde',
      longDescription: 'L\'ANDAR soutient les personnes atteintes d\'arthrite rhumatoïde, maladie inflammatoire chronique, et propose information, entraide et défense de leurs droits.',
      categories: ['Arthrite rhumatoïde', 'Maladie inflammatoire'],
      logoPlaceholder: 'A',
      website: 'https://www.polyarthrite-andar.com',
      imagePath: require('../assets/images/associations/21.webp'),
      logoPath: require('../assets/images/logos/andar.webp')
    },
    {
      id: '58',
      name: 'APAHJ',
      description: 'Association Pour Adultes et Jeunes Handicapés',
      longDescription: 'L\'APAHJ œuvre pour l\'insertion et l\'autonomie des personnes handicapées, adultes et jeunes, et propose des services adaptés à leurs besoins spécifiques.',
      categories: ['Handicap', 'Insertion', 'Autonomie'],
      logoPlaceholder: 'A',
      website: 'https://www.apajh.org',
      imagePath: require('../assets/images/associations/8.webp'),
      logoPath: require('../assets/images/logos/apajh.webp')
    },
    {
      id: '59',
      name: 'APODEC',
      description: 'Association Porteurs de défibrillateurs cardiaques',
      longDescription: 'APODEC regroupe et soutient les personnes portant un défibrillateur cardiaque implantable, les informe sur leur dispositif et défend leurs intérêts auprès des autorités de santé.',
      categories: ['Défibrillateur cardiaque', 'Maladies cardiaques'],
      logoPlaceholder: 'A',
      website: 'https://www.apodec.fr',
      imagePath: require('../assets/images/associations/13.webp'),
      logoPath: require('../assets/images/logos/apodec.webp')
    },
    {
      id: '60',
      name: 'ARSLA',
      description: 'Association pour la recherche sur la sclérose latérale amyotrophique',
      longDescription: 'L\'ARSLA soutient les personnes atteintes de SLA (maladie de Charcot) et leurs proches, et finance la recherche pour comprendre et traiter cette maladie neurodégénérative.',
      categories: ['Sclérose latérale amyotrophique', 'Maladie de Charcot'],
      logoPlaceholder: 'A',
      website: 'https://www.arsla.org',
      imagePath: require('../assets/images/associations/4.webp'),
      logoPath: require('../assets/images/logos/arsla.webp')
    }
  ],
  "Soutien et entraide": [
    {
      id: '61',
      name: 'ASBH',
      description: 'Association nationale Spina Bifida et Handicaps Associés',
      longDescription: 'L\'ASBH accompagne les personnes atteintes de spina bifida, malformation congénitale de la colonne vertébrale, et leurs familles dans leur parcours médical et social.',
      categories: ['Spina bifida', 'Malformation congénitale'],
      logoPlaceholder: 'A',
      website: 'https://www.spina-bifida.org',
      imagePath: require('../assets/images/associations/11.webp'),
      logoPath: require('../assets/images/logos/asbh.webp')
    },
    {
      id: '62',
      name: 'ASF',
      description: 'Association des Sclérodermiques de France',
      longDescription: 'L\'ASF soutient les personnes atteintes de sclérodermie, maladie auto-immune du tissu conjonctif, et finance la recherche pour améliorer les traitements de cette pathologie rare.',
      categories: ['Sclérodermie', 'Maladie auto-immune'],
      logoPlaceholder: 'A',
      website: 'https://www.association-sclerodermie.fr',
      imagePath: require('../assets/images/associations/26.webp'),
      logoPath: require('../assets/images/logos/asf.webp')
    },
    {
      id: '63',
      name: 'ASFC',
      description: 'Association Française du Syndrome de Fatigue Chronique',
      longDescription: 'L\'ASFC informe sur l\'encéphalomyélite myalgique (SFC/EM) et aide les personnes touchées par cette maladie caractérisée par une fatigue invalidante et des douleurs diffuses.',
      categories: ['Syndrome de fatigue chronique', 'Encéphalomyélite myalgique'],
      logoPlaceholder: 'A',
      website: 'https://www.asso-sfc.org',
      imagePath: require('../assets/images/associations/25.webp'),
      logoPath: require('../assets/images/logos/asfc.webp')
    },
    {
      id: '64',
      name: 'ASSOCIATION DES BRÛLÉS DE FRANCE',
      description: 'Association nationale d\'aide aux victimes de brûlures',
      longDescription: 'L\'Association des Brûlés de France soutient les personnes brûlées et leurs proches, les accompagne dans leur reconstruction physique et psychologique, et sensibilise à la prévention.',
      categories: ['Brûlures', 'Réadaptation'],
      logoPlaceholder: 'A',
      website: 'https://www.associationdesbrules.org',
      imagePath: require('../assets/images/associations/29.webp'),
      logoPath: require('../assets/images/logos/abf.webp')
    },
    {
      id: '65',
      name: 'AUTISME FRANCE',
      description: 'Association nationale de parents et de professionnels',
      longDescription: 'Autisme France agit pour la reconnaissance des droits des personnes autistes, favorise leur inclusion sociale et promeut des méthodes d\'accompagnement adaptées à leurs besoins.',
      categories: ['Autisme', 'Troubles du spectre autistique'],
      logoPlaceholder: 'A',
      website: 'https://www.autisme-france.fr',
      imagePath: require('../assets/images/associations/24.webp'),
      logoPath: require('../assets/images/logos/autismefr.webp')
    },
    {
      id: '66',
      name: 'AVIAM',
      description: 'Association d\'aide aux victimes d\'accidents médicaux',
      longDescription: 'L\'AVIAM soutient les victimes d\'accidents médicaux, les informe sur leurs droits et les accompagne dans leurs démarches pour obtenir réparation et reconnaissance.',
      categories: ['Accidents médicaux', 'Défense des droits'],
      logoPlaceholder: 'A',
      website: 'http://aviamfrance.org',
      imagePath: require('../assets/images/associations/5.webp'),
      logoPath: require('../assets/images/logos/aviam.webp')
    },
    {
      id: '67',
      name: 'CADUS',
      description: 'Conseil Aide et Défense des Usagers de la Santé',
      longDescription: 'CADUS défend les droits des usagers du système de santé, les conseille en cas de litige ou d\'accident médical, et milite pour une meilleure qualité et sécurité des soins.',
      categories: ['Défense des usagers', 'Droit de la santé'],
      logoPlaceholder: 'C',
      website: 'https://www.cadus.fr',
      imagePath: require('../assets/images/associations/6.webp'),
      logoPath: require('../assets/images/logos/cadus.webp')
    },
    {
      id: '68',
      name: 'CLCV',
      description: 'Consommation, logement, cadre de vie',
      longDescription: 'La CLCV défend les intérêts des consommateurs et usagers, notamment dans le domaine de la santé, et intervient sur les questions de qualité des soins et d\'accès aux droits.',
      categories: ['Consommation', 'Défense des usagers'],
      logoPlaceholder: 'C',
      website: 'https://www.clcv.org',
      imagePath: require('../assets/images/associations/9.webp'),
      logoPath: require('../assets/images/logos/clcv.webp')
    }
  ],
  "Autres organisations": [
    {
      id: '69',
      name: 'E3M',
      description: 'Association d\'Entraide aux Malades de Myofasciite à Macrophages',
      longDescription: 'E3M soutient les personnes atteintes de myofasciite à macrophages, pathologie liée à l\'aluminium vaccinal, et milite pour la reconnaissance de cette maladie émergente.',
      categories: ['Myofasciite à macrophages', 'Effets indésirables vaccinaux'],
      logoPlaceholder: 'E',
      website: 'https://www.asso-e3m.fr',
      imagePath: require('../assets/images/associations/21.webp'),
      logoPath: require('../assets/images/logos/e3m.webp')
    },
    {
      id: '70',
      name: 'EFAPPE EPILEPSIES',
      description: 'Fédération des Associations en faveur des Personnes handicapées par des Épilepsies sévères',
      longDescription: 'EFAPPE Epilepsies rassemble des associations qui soutiennent les personnes handicapées par une épilepsie sévère et leurs familles, et défend leurs droits et leurs intérêts.',
      categories: ['Épilepsie sévère', 'Handicap'],
      logoPlaceholder: 'E',
      website: 'https://efappe.epilepsies.fr',
      imagePath: require('../assets/images/associations/28.webp'),
      logoPath: require('../assets/images/logos/efappe.webp')
    },
    {
      id: '71',
      name: 'ENDOFRANCE',
      description: 'Association Française de lutte contre l\'endométriose',
      longDescription: 'EndoFrance soutient les femmes atteintes d\'endométriose, maladie gynécologique chronique, et agit pour faire connaître et reconnaître cette pathologie encore trop ignorée.',
      categories: ['Endométriose', 'Santé des femmes'],
      logoPlaceholder: 'E',
      website: 'https://www.endofrance.org',
      imagePath: require('../assets/images/associations/24.webp'),
      logoPath: require('../assets/images/logos/endofr.webp')
    },
    {
      id: '72',
      name: 'ENDOMIND',
      description: 'Association d\'actions contre l\'endométriose',
      longDescription: 'ENDOmind informe sur l\'endométriose, sensibilise le grand public et les professionnels de santé, et milite pour une meilleure prise en charge de cette maladie gynécologique.',
      categories: ['Endométriose', 'Santé des femmes'],
      logoPlaceholder: 'E',
      website: 'https://www.endomind.org',
      imagePath: require('../assets/images/associations/24.webp'),
      logoPath: require('../assets/images/logos/endomind.webp')
    },
    {
      id: '73',
      name: 'ENTRAID\'ADDICT',
      description: 'Fédération Alcool Assistance',
      longDescription: 'Entraid\'Addict (anciennement Alcool Assistance) accompagne les personnes dépendantes et leurs proches, dans une démarche d\'entraide et de soutien mutuel.',
      categories: ['Addictions', 'Alcoolisme'],
      logoPlaceholder: 'E',
      website: 'https://entraidaddict.fr',
      imagePath: require('../assets/images/associations/diabete.webp'),
      logoPath: require('../assets/images/logos/ea.webp')
    },
    {
      id: '74',
      name: 'ÉPILEPSIE-FRANCE',
      description: 'Association nationale des patients et familles concernés par l\'épilepsie',
      longDescription: 'Épilepsie-France accompagne les personnes épileptiques et leurs proches, les informe sur la maladie et ses traitements, et lutte contre les discriminations dont elles sont victimes.',
      categories: ['Épilepsie', 'Soutien aux familles'],
      logoPlaceholder: 'E',
      website: 'https://www.epilepsie-france.fr',
      imagePath: require('../assets/images/associations/20.webp'),
      logoPath: require('../assets/images/logos/epilepsiefr.webp')
    },
    {
      id: '75',
      name: 'FFDSB',
      description: 'Fédération Française pour le Don de Sang Bénévole',
      longDescription: 'La FFDSB promeut le don de sang bénévole, volontaire et non rémunéré, et défend les intérêts des donneurs dans le cadre de l\'éthique transfusionnelle.',
      categories: ['Don de sang', 'Transfusion'],
      logoPlaceholder: 'F',
      website: 'https://www.ffdsb.org',
      imagePath: require('../assets/images/associations/21.webp'),
      logoPath: require('../assets/images/logos/ffdsb.webp')
    },
    {
      id: '76',
      name: 'FFSA',
      description: 'Fédération Française Sésame Autisme',
      longDescription: 'La FFSA regroupe des associations qui accompagnent les personnes autistes et leurs familles, et gère des établissements adaptés à leurs besoins spécifiques.',
      categories: ['Autisme', 'Accompagnement spécialisé'],
      logoPlaceholder: 'F',
      website: 'https://www.sesameautisme.fr',
      imagePath: require('../assets/images/associations/13.webp'),
      logoPath: require('../assets/images/logos/sa.webp')
    }
  ],
  "Recherche et soutien": [
    {
      id: '77',
      name: 'FGCP',
      description: 'Fédération Française des Associations de Greffés du Cœur et des Poumons',
      longDescription: 'La FGCP rassemble les associations de greffés cardiaques et pulmonaires, soutient les patients avant et après transplantation, et promeut le don d\'organes.',
      categories: ['Greffe cardiaque', 'Greffe pulmonaire'],
      logoPlaceholder: 'F',
      website: 'https://www.france-coeur-poumon.asso.fr',
      imagePath: require('../assets/images/associations/29.webp'),
      logoPath: require('../assets/images/logos/fgcp.webp')
    },
    {
      id: '78',
      name: 'FIBROMYALGIE SOS',
      description: 'Association de soutien aux personnes atteintes de fibromyalgie',
      longDescription: 'Fibromyalgie SOS aide les personnes souffrant de fibromyalgie, syndrome caractérisé par des douleurs diffuses chroniques, et milite pour la reconnaissance de cette pathologie.',
      categories: ['Fibromyalgie', 'Douleurs chroniques'],
      logoPlaceholder: 'F',
      website: 'https://www.fibromyalgiesos.fr',
      imagePath: require('../assets/images/associations/14.webp'),
      logoPath: require('../assets/images/logos/fan.webp')
    },
    {
      id: '79',
      name: 'FNAR',
      description: 'Fédération nationale des associations de retraités et préretraités',
      longDescription: 'La FNAR représente et défend les intérêts des retraités et préretraités, notamment dans le domaine de la santé et de la protection sociale, et veille à leurs droits.',
      categories: ['Retraités', 'Protection sociale'],
      logoPlaceholder: 'F',
      website: 'https://fnar.info',
      imagePath: require('../assets/images/associations/14.webp'),
      logoPath: require('../assets/images/logos/fnar.webp')
    },
    {
      id: '80',
      name: 'FRANCE LYME',
      description: 'Association de lutte contre les maladies vectorielles à tiques',
      longDescription: 'France Lyme informe sur la maladie de Lyme et autres maladies transmises par les tiques, soutient les patients et œuvre pour une meilleure reconnaissance et prise en charge.',
      categories: ['Maladie de Lyme', 'Maladies vectorielles'],
      logoPlaceholder: 'F',
      website: 'https://francelyme.fr',
      imagePath: require('../assets/images/associations/15.webp'),
      logoPath: require('../assets/images/logos/fl.webp')
    },
    {
      id: '81',
      name: 'FRANCE REIN',
      description: 'Association de patients et de proches concernés par les maladies rénales',
      longDescription: 'France Rein accompagne les patients insuffisants rénaux, promeut le don d\'organes et la greffe de rein, et sensibilise à la prévention des maladies rénales.',
      categories: ['Insuffisance rénale', 'Dialyse', 'Greffe'],
      logoPlaceholder: 'F',
      website: 'https://www.francerein.org',
      imagePath: require('../assets/images/associations/11.webp'),
      logoPath: require('../assets/images/logos/frrein.webp')
    },
    {
      id: '82',
      name: 'HYPERSUPERS TDAH FRANCE',
      description: 'Association pour aider les familles, adultes et enfants concernés par le Trouble Déficit de l\'Attention / Hyperactivité',
      longDescription: 'HyperSupers TDAH France informe sur le TDAH, soutient les personnes concernées et leurs familles, et favorise le diagnostic précoce et une prise en charge adaptée.',
      categories: ['TDAH', 'Troubles de l\'attention'],
      logoPlaceholder: 'H',
      website: 'https://www.tdah-france.fr',
      imagePath: require('../assets/images/associations/28.webp'),
      logoPath: require('../assets/images/logos/hs.webp')
    },
    {
      id: '83',
      name: 'JALMALV',
      description: 'Jusqu\'à la mort accompagner la vie',
      longDescription: 'JALMALV accompagne les personnes en fin de vie et leurs proches, forme des bénévoles à cet accompagnement et milite pour le développement des soins palliatifs.',
      categories: ['Soins palliatifs', 'Fin de vie'],
      logoPlaceholder: 'J',
      website: 'https://www.jalmalv-federation.fr',
      imagePath: require('../assets/images/associations/11.webp'),
      logoPath: require('../assets/images/logos/jamalv.webp')
    },
    {
      id: '84',
      name: 'LA CROIX BLEUE',
      description: 'Association d\'aide aux personnes en difficulté avec l\'alcool',
      longDescription: 'La Croix Bleue accompagne les personnes dépendantes de l\'alcool vers l\'abstinence et la guérison, dans une démarche de soutien mutuel et de réinsertion sociale.',
      categories: ['Alcoolisme', 'Abstinence'],
      logoPlaceholder: 'C',
      website: 'https://www.croixbleue.fr',
      imagePath: require('../assets/images/associations/20.webp'),
      logoPath: require('../assets/images/logos/cb.webp')
    },
    {
      id: '85',
      name: 'ADDICTION ALCOOL VIE LIBRE',
      description: 'Association d\'aide aux personnes en difficulté avec l\'alcool',
      longDescription: 'addiction alcool vie libre accompagne les personnes dépendantes de l\'alcool vers l\'abstinence et la guérison,       dans une démarche de soutien mutuel et de réinsertion sociale.',
      categories: ['Alcoolisme', 'Abstinence'],
      logoPlaceholder: 'A',
      website: 'https://www.vielibre.org/',
      imagePath: require('../assets/images/associations/diabete.webp'),
      logoPath: require('../assets/images/logos/aavl.webp')
    },
    {
      id: '86',
      name: 'ADEPA',
      description: 'Association d\'aide aux personnes amputés',
      longDescription: 'L\'A.D.E.P.A est une association faite pour unir nos forces. Nous voulons délivrer un message d\'espoir aux nouveaux adhérents, récemment amputés ou non : un changement de regard est nécessaire, un nouveau quotidien est à inventer.',
      categories: ['amputation', 'union'],
      logoPlaceholder: 'A',
      website: 'https://www.adepa.fr/',
      imagePath: require('../assets/images/associations/7.webp'),
      logoPath: require('../assets/images/logos/adepa.webp')
    },
    {
      id: '87',
      name: 'ADMD',
      description: 'Association pour le droit de mourir dans la diginté',
      longDescription: 'l\'Association pour le Droit de Mourir dans la Dignité milite pour que chaque Française et chaque Français puisse choisir les conditions de sa propre fin de vie. Conformément à ses conceptions personnelles de dignité et de liberté.',
      categories: ['fin de vie', 'protéction sociale'],
      logoPlaceholder: 'A',
      website: 'https://admd.france-assos-sante.org/',
      imagePath: require('../assets/images/associations/27.webp'),
      logoPath: require('../assets/images/logos/admd.webp')
    },
    {
      id: '88',
      name: 'ADVOCACYFR',
      description: 'Advocacy france',
      longDescription: 'L\'association Advocacy France est une association d\'usagers en santé mentale, médico-sociale et sociale. Notre association d\'usagers de la santé est un intermédiaire entre la personne en souffrance psychique et l\'environnement social.',
      categories: ['santé mentale', 'santé sociale'],
      logoPlaceholder: 'A',
      website: 'https://www.advocacy.fr/',
      imagePath: require('../assets/images/associations/22.webp'),
      logoPath: require('../assets/images/logos/advocacyfr.webp')
    },
    {
      id: '89',
      name: 'ALL',
      description: 'association le lien',
      longDescription: 'Le cœur de mission du LIEN est de défendre les victimes d\'accidents médicaux. Son action s\'exerce dans le cadre de la lutte contre les infections nosocomiales et les accidents médicaux, qu\'il s\'agisse d\'erreurs, de fautes ou d\'aléas.',
      categories: ['accidents médicaux'],
      logoPlaceholder: 'A',
      website: 'https://lelien.france-assos-sante.org/',
      imagePath: require('../assets/images/associations/6.webp'),
      logoPath: require('../assets/images/logos/all.webp')
    },
    {
      id: '90',
      name: 'PFP',
      description: 'petit frère des pauvre',
      longDescription: 'les Petits Frères des Pauvres accompagnent les personnes âgées souffrant d\'isolement, prioritairement les plus démunies. Par nos actions, nous recréons des liens leur permettant de retrouver une dynamique de vie. Par notre voix, nous incitons la société à changer de regard sur la vieillesse, nous témoignons des situations inacceptables que nous rencontrons, nous alertons les pouvoirs publics sur la nécessité d\'agir, nous favorisons l\'engagement citoyen, nous proposons des réponses nouvelles.',
      categories: ['agé','retraité','solitude', 'isolement'],
      logoPlaceholder: 'P',
      website: 'https://www.petitsfreresdespauvres.fr/',
      imagePath: require('../assets/images/associations/11.webp'),
      logoPath: require('../assets/images/logos/pfp.webp')
    },
    {
      id: '91',
      name: 'UFMV',
      description: 'Union des associations françaises de laryngectomisés et mutilés de la voix',
      longDescription: 'Leur objectif est d\'inciter les futurs ou nouveaux opérés à surmonter l\'épreuve à laquelle ils sont confrontés en suivant leur exemple et leurs conseils. Pour ce faire, ils leur prodiguent une aide morale et psychologique',
      categories: ['larynx','cancer','voix'],
      logoPlaceholder: 'U',
      website: 'https://www.mutiles-voix.com/',
      imagePath: require('../assets/images/associations/28.webp'),
      logoPath: require('../assets/images/logos/ufmv.webp')
    }
  ]
}; 