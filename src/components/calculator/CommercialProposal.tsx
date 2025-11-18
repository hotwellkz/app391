import React, { useState, useEffect, useRef } from 'react';
import { Copy, Home, Building, Wrench, Palette, ChevronDown, Download, FileText } from 'lucide-react';
import { CalculationResult } from '../../types/calculator';
import { useMenuVisibility } from '../../contexts/MenuVisibilityContext';
import { calculateTrucksNeeded } from '../../utils/deliveryData';

// Декларация типов для html2pdf.js
declare const html2pdf: any;

interface CommercialProposalProps {
  area: number;
  parameters: {
    foundation: string;
    floors: string;
    firstFloorType?: string;
    secondFloorType?: string;
    thirdFloorType?: string;
    firstFloorHeight: string;
    secondFloorHeight?: string;
    thirdFloorHeight?: string;
    firstFloorThickness: string;
    secondFloorThickness?: string;
    thirdFloorThickness?: string;
    partitionType: string;
    ceiling: string;
    roofType: string;
    houseShape: string;
    additionalWorks: string;
    useCustomWorks: boolean;
    customWorks: Array<{ name: string; price: number | string }>;
    deliveryCity?: string;
  };
  result: CalculationResult;
  options: {
    isVatIncluded: boolean;
    isInstallment: boolean;
    installmentAmount: number;
    hideFundamentCost?: boolean;
    hideKitCost?: boolean;
    hideAssemblyCost?: boolean;
    hideDeliveryCost?: boolean;
  };
}

type ThemeType = 'light' | 'dark' | 'classic' | 'red-power' | 'luxury-black-gold' | 'eco-natural' | 'marine' | 'tech' | 'hi-tech' | 'construction' | 'mobile';

export const CommercialProposal: React.FC<CommercialProposalProps> = ({
  area,
  parameters,
  result,
  options
}) => {
  // Функция определения мобильного устройства
  const isMobileDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile'];
    const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
    const isMobileWidth = window.innerWidth <= 768;
    
    return isMobileUserAgent || isMobileWidth;
  };

  // Состояние для выбора темы
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('light');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Контекст и ref для отслеживания видимости
  const { setMenuVisible } = useMenuVisibility();
  const commercialProposalRef = useRef<HTMLDivElement>(null);

  const themes = [
    { id: 'light' as ThemeType, name: 'Светлая (зелёная)', description: 'Стандартная тема HotWell.kz' },
    { id: 'dark' as ThemeType, name: 'Премиум (тёмная)', description: 'Современный дизайн с неоновыми акцентами' },
    { id: 'classic' as ThemeType, name: 'Классическая', description: 'Элегантный деловой стиль' },
    { id: 'red-power' as ThemeType, name: 'Красная', description: 'Мощный красный дизайн премиум-класса' },
    { id: 'luxury-black-gold' as ThemeType, name: 'Luxury Black & Gold', description: 'Эксклюзивный дизайн для VIP-клиентов' },
    { id: 'eco-natural' as ThemeType, name: 'Эко натуральная', description: 'Тёплый природный дизайн для эко-сознательных клиентов' },
    { id: 'marine' as ThemeType, name: 'Морская', description: 'Свежий океанический дизайн с морскими акцентами' },
    { id: 'tech' as ThemeType, name: 'Технологичная', description: 'Футуристический дизайн с неоновыми элементами' },
    { id: 'hi-tech' as ThemeType, name: 'Хай-тек', description: 'Минималистичный корпоративный дизайн высоких технологий' },
    { id: 'construction' as ThemeType, name: 'Строительная', description: 'Промышленный дизайн для профессионалов строительства' },
    { id: 'mobile' as ThemeType, name: 'Мобильная', description: 'Компактная тема для смартфонов' }
  ];

  // Загрузка сохраненной темы из localStorage с автоматическим определением мобильной темы
  useEffect(() => {
    const savedTheme = localStorage.getItem('commercialProposalTheme') as ThemeType;
    
    // Если есть сохраненная тема и она валидная, используем её
    if (savedTheme && themes.find(theme => theme.id === savedTheme)) {
      setCurrentTheme(savedTheme);
    } else if (isMobileDevice()) {
      // Если мобильное устройство и нет сохраненной темы, используем мобильную тему
      setCurrentTheme('mobile');
      localStorage.setItem('commercialProposalTheme', 'mobile');
    }
  }, []);

  // Обработчик изменения размера окна для адаптивного переключения
  useEffect(() => {
    const handleResize = () => {
      const savedTheme = localStorage.getItem('commercialProposalTheme') as ThemeType;
      
      // Если пользователь не выбирал тему вручную, автоматически переключаем
      if (!savedTheme || savedTheme === 'mobile' || savedTheme === 'light') {
        if (isMobileDevice() && currentTheme !== 'mobile') {
          setCurrentTheme('mobile');
        } else if (!isMobileDevice() && currentTheme === 'mobile') {
          setCurrentTheme('light');
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentTheme]);

  // IntersectionObserver для отслеживания видимости коммерческого предложения
  useEffect(() => {
    if (!commercialProposalRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // Если коммерческое предложение видно на 40% или больше
        const shouldHideMenu = entry.isIntersecting && entry.intersectionRatio >= 0.4;
        
        // Проверяем, выбрана ли мобильная тема
        const isMobileTheme = currentTheme === 'mobile';
        
        // Управляем MenuVisibilityContext (влияет на условное отображение в React компонентах)
        if (!isMobileDevice() || !isMobileTheme) {
          // Если не мобильное устройство или не мобильная тема, используем только контекст
          setMenuVisible(!shouldHideMenu);
        } else {
          // Если мобильная тема выбрана, скрываем элементы через CSS классы
          setMenuVisible(!shouldHideMenu);
          
          // Находим элементы для скрытия
          const elementsToHide = [
            // Бургер-меню
            document.querySelector('button[class*="fixed top-4 left-4"]'), // кнопка бургер-меню
            // Плавающие кнопки справа
            document.querySelector('div[class*="fixed bottom-32 right-4"]'), // контейнер с плавающими кнопками
          ];
          
          // Также ищем по более специфичным селекторам
          const additionalElements = [
            document.querySelector('.burger-menu'),
            document.querySelector('.sidebar-toggle'),
            document.querySelector('#burger'),
            document.querySelector('.floating-buttons'),
            document.querySelector('.side-actions'),
            document.querySelector('.menu-right'),
            ...document.querySelectorAll('button[title="Лента"]'),
            ...document.querySelectorAll('button[title="Клиенты"]'),
            ...document.querySelectorAll('button[title="Склад"]'),
            ...document.querySelectorAll('button[title="Транзакции"]'),
            ...document.querySelectorAll('button[title="WhatsApp"]'),
          ];
          
          // Объединяем все найденные элементы
          const allElementsToHide = [...elementsToHide, ...additionalElements].filter(Boolean);
          
          // Применяем/убираем класс hidden
          allElementsToHide.forEach(el => {
            if (el) {
              if (shouldHideMenu) {
                el.classList.add('hidden');
              } else {
                el.classList.remove('hidden');
              }
            }
          });
        }
      },
      {
        threshold: [0, 0.1, 0.4, 0.8, 1.0],
        rootMargin: '0px 0px -100px 0px',
      }
    );

    observer.observe(commercialProposalRef.current);

    return () => {
      observer.disconnect();
      // Восстанавливаем видимость меню при размонтировании
      setMenuVisible(true);
      
      // Убираем класс hidden со всех элементов при размонтировании
      const elementsToRestore = [
        document.querySelector('button[class*="fixed top-4 left-4"]'),
        document.querySelector('div[class*="fixed bottom-32 right-4"]'),
        document.querySelector('.burger-menu'),
        document.querySelector('.sidebar-toggle'),
        document.querySelector('#burger'),
        document.querySelector('.floating-buttons'),
        document.querySelector('.side-actions'),
        document.querySelector('.menu-right'),
        ...document.querySelectorAll('button[title="Лента"]'),
        ...document.querySelectorAll('button[title="Клиенты"]'),
        ...document.querySelectorAll('button[title="Склад"]'),
        ...document.querySelectorAll('button[title="Транзакции"]'),
        ...document.querySelectorAll('button[title="WhatsApp"]'),
      ].filter(Boolean);
      
      elementsToRestore.forEach(el => {
        if (el) {
          el.classList.remove('hidden');
        }
      });
    };
  }, [setMenuVisible, currentTheme]); // Добавляем currentTheme в зависимости

  // Восстановление видимости меню при размонтировании компонента
  useEffect(() => {
    return () => {
      setMenuVisible(true);
    };
  }, [setMenuVisible]);

  // Восстановление элементов при переключении с мобильной темы
  useEffect(() => {
    // Если тема изменилась и это не мобильная тема, восстанавливаем элементы
    if (currentTheme !== 'mobile') {
      const elementsToRestore = [
        document.querySelector('button[class*="fixed top-4 left-4"]'),
        document.querySelector('div[class*="fixed bottom-32 right-4"]'),
        document.querySelector('.burger-menu'),
        document.querySelector('.sidebar-toggle'),
        document.querySelector('#burger'),
        document.querySelector('.floating-buttons'),
        document.querySelector('.side-actions'),
        document.querySelector('.menu-right'),
        ...document.querySelectorAll('button[title="Лента"]'),
        ...document.querySelectorAll('button[title="Клиенты"]'),
        ...document.querySelectorAll('button[title="Склад"]'),
        ...document.querySelectorAll('button[title="Транзакции"]'),
        ...document.querySelectorAll('button[title="WhatsApp"]'),
      ].filter(Boolean);
      
      elementsToRestore.forEach(el => {
        if (el) {
          el.classList.remove('hidden');
        }
      });
      
      // Восстанавливаем видимость через контекст
      setMenuVisible(true);
    }
  }, [currentTheme, setMenuVisible]);

  // Сохранение темы в localStorage
  const changeTheme = (theme: ThemeType) => {
    console.log('🎨 Переключение темы:', { 
      from: currentTheme, 
      to: theme, 
      themeName: themes.find(t => t.id === theme)?.name 
    });
    setCurrentTheme(theme);
    localStorage.setItem('commercialProposalTheme', theme);
    setIsDropdownOpen(false);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const { 
    isVatIncluded, 
    isInstallment, 
    installmentAmount,
    hideFundamentCost = false,
    hideKitCost = false,
    hideAssemblyCost = false,
    hideDeliveryCost = false
  } = options;

  // Определение классов для стилей в зависимости от темы
  const getContainerClasses = () => {
    switch (currentTheme) {
      case 'dark':
        return "bg-[#121212] rounded-lg shadow-lg border border-gray-800 overflow-hidden shadow-[0_0_30px_rgba(0,255,140,0.2)] transition-all duration-300 ease-in-out";
      case 'classic':
        return "bg-white rounded-lg overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#DDDDDD] transition-all duration-300 ease-in-out";
      case 'red-power':
        return "bg-white rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(196,0,33,0.1)] border border-[#ffccd5] transition-all duration-300 ease-in-out";
      case 'luxury-black-gold':
        return "bg-[#0f0f0f] rounded-lg overflow-hidden shadow-[0_4px_12px_rgba(255,215,0,0.05)] border border-[#333333] transition-all duration-300 ease-in-out";
      case 'eco-natural':
        return "bg-white rounded-lg overflow-hidden shadow-[0_2px_6px_rgba(0,0,0,0.05)] border border-[#dce9db] transition-all duration-300 ease-in-out";
      case 'marine':
        return "bg-white rounded-[12px] overflow-hidden shadow-[0_2px_6px_rgba(0,88,122,0.1)] border border-[#b3e0ff] transition-all duration-300 ease-in-out";
      case 'tech':
        return "bg-[#1A1A1D] rounded-[8px] overflow-hidden shadow-[0_4px_16px_rgba(0,240,255,0.15)] border border-[#00F0FF] transition-all duration-300 ease-in-out";
      case 'hi-tech':
        return "bg-[#0F0F0F] rounded-[6px] overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.3)] border border-[#00FFFF] transition-all duration-500 ease-in-out hover:shadow-[0_0_30px_rgba(0,255,255,0.5)]";
      case 'construction':
        return "bg-[#F2F2F2] rounded-[4px] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.3)] border-4 border-[#333333] transition-all duration-300 ease-in-out";
      case 'mobile':
        return "bg-white rounded-md overflow-hidden shadow-sm border border-gray-300 transition-all duration-200 scale-90 origin-top";
      default:
        return "bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out";
    }
  };

  const getHeaderClasses = () => {
    switch (currentTheme) {
      case 'dark':
        return "bg-gradient-to-r from-gray-900 to-black text-white p-6 text-center border-b border-[#00FF8C] transition-all duration-300 ease-in-out";
      case 'classic':
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-[#333333] p-6 text-center border-b border-[#DDDDDD] transition-all duration-300 ease-in-out";
      case 'red-power':
        return "bg-[#c40021] text-white p-6 text-center border-b border-[#ffccd5] transition-all duration-300 ease-in-out";
      case 'luxury-black-gold':
        return "bg-[#1a1a1a] text-white p-6 text-center border-b border-[#333333] transition-all duration-300 ease-in-out";
      case 'eco-natural':
        return "bg-[#e9f5e1] text-[#2d572c] p-6 text-center border-b border-[#d4e1d4] transition-all duration-300 ease-in-out";
      case 'marine':
        return "bg-[#00aaff] text-white p-6 text-center border-b border-[#b3e0ff] transition-all duration-300 ease-in-out";
      case 'tech':
        return "bg-gradient-to-r from-[#1A1A1D] to-[#2A2A2D] text-white p-6 text-center border-b border-[#00F0FF] transition-all duration-300 ease-in-out";
      case 'hi-tech':
        return "bg-[#0F0F0F] text-white p-6 text-center border-b-2 border-[#00FFFF] transition-all duration-500 ease-in-out";
      case 'construction':
        return "bg-[#FFCC00] text-[#000000] p-6 text-center border-b-4 border-[#333333] transition-all duration-300 ease-in-out";
      case 'mobile':
        return "bg-emerald-500 text-white p-3 text-center border-b border-emerald-600 transition-all duration-200 ease-in-out";
      default:
        return "bg-gradient-to-r from-emerald-600 to-green-600 text-white p-6 text-center transition-all duration-300 ease-in-out";
    }
  };

  const getSectionClasses = () => {
    switch (currentTheme) {
      case 'dark':
        return "bg-[#1a1a1a] rounded-lg p-4 border border-[#2A2A2A] transition-all duration-300 ease-in-out";
      case 'classic':
        return "bg-[#FAFAFA] rounded-lg p-4 border border-[#DDDDDD] transition-all duration-300 ease-in-out";
      case 'red-power':
        return "bg-white rounded-lg p-4 border border-[#ffccd5] shadow-[0_2px_8px_rgba(196,0,33,0.1)] transition-all duration-300 ease-in-out";
      case 'luxury-black-gold':
        return "bg-[#1c1c1c] rounded-lg p-4 border border-[#333333] shadow-[0_4px_12px_rgba(255,215,0,0.05)] transition-all duration-300 ease-in-out";
      case 'eco-natural':
        return "bg-white rounded-[8px] p-4 border border-[#dce9db] shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out";
      case 'marine':
        return "bg-white rounded-[12px] p-4 border border-[#b3e0ff] shadow-[0_2px_6px_rgba(0,88,122,0.1)] transition-all duration-300 ease-in-out";
      case 'tech':
        return "bg-[#2A2A2D] rounded-[8px] p-4 border border-[#00F0FF] shadow-[0_2px_8px_rgba(0,240,255,0.2)] transition-all duration-300 ease-in-out hover:shadow-[0_4px_12px_rgba(0,240,255,0.3)]";
      case 'hi-tech':
        return "bg-[#1E1E1E] rounded-[6px] p-4 border border-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.2)] transition-all duration-500 ease-in-out hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:border-[#39FF14]";
      case 'construction':
        return "bg-[#EDEDED] rounded-[4px] p-4 border-2 border-[#555555] shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out hover:shadow-[0_4px_8px_rgba(0,0,0,0.3)]";
      case 'mobile':
        return "bg-gray-50 rounded p-2 border border-gray-200 transition-all duration-200 ease-in-out";
      default:
        return "bg-gray-50 rounded-lg p-4 transition-all duration-300 ease-in-out";
    }
  };

  const getTextClasses = (variant: 'title' | 'subtitle' | 'body' | 'accent') => {
    switch (currentTheme) {
      case 'dark':
        switch (variant) {
          case 'title': return "text-lg font-semibold text-white tracking-wide transition-all duration-300 ease-in-out";
          case 'subtitle': return "font-medium text-white transition-all duration-300 ease-in-out";
          case 'body': return "text-sm text-[#CCCCCC] leading-relaxed transition-all duration-300 ease-in-out";
          case 'accent': return "text-[#00FF8C] transition-all duration-300 ease-in-out";
        }
        break;
      case 'classic':
        switch (variant) {
          case 'title': return "text-lg font-semibold text-[#333333] font-serif transition-all duration-300 ease-in-out";
          case 'subtitle': return "font-medium text-[#333333] font-serif transition-all duration-300 ease-in-out";
          case 'body': return "text-sm text-[#666666] leading-relaxed transition-all duration-300 ease-in-out";
          case 'accent': return "text-[#800000] transition-all duration-300 ease-in-out";
        }
        break;
      case 'red-power':
        switch (variant) {
          case 'title': return "text-lg font-semibold text-[#333333] tracking-wide transition-all duration-300 ease-in-out";
          case 'subtitle': return "font-medium text-[#333333] transition-all duration-300 ease-in-out";
          case 'body': return "text-sm text-[#333333] leading-relaxed transition-all duration-300 ease-in-out";
          case 'accent': return "text-[#c40021] transition-all duration-300 ease-in-out";
        }
        break;
      case 'luxury-black-gold':
        switch (variant) {
          case 'title': return "text-xl font-semibold text-[#f5f5f5] tracking-wide transition-all duration-300 ease-in-out";
          case 'subtitle': return "font-medium text-[#f5f5f5] transition-all duration-300 ease-in-out";
          case 'body': return "text-base text-[#f5f5f5] leading-relaxed transition-all duration-300 ease-in-out";
          case 'accent': return "text-[#FFD700] transition-all duration-300 ease-in-out";
        }
        break;
      case 'eco-natural':
        switch (variant) {
          case 'title': return "text-xl font-bold text-[#2d572c] tracking-wide transition-all duration-300 ease-in-out";
          case 'subtitle': return "font-semibold text-[#4e4e4e] transition-all duration-300 ease-in-out";
          case 'body': return "text-base text-[#4e4e4e] leading-relaxed transition-all duration-300 ease-in-out";
          case 'accent': return "text-[#33691e] transition-all duration-300 ease-in-out";
        }
        break;
      case 'marine':
        switch (variant) {
          case 'title': return "text-xl font-semibold text-[#00587a] tracking-wide font-sans transition-all duration-300 ease-in-out";
          case 'subtitle': return "font-semibold text-[#00587a] font-sans transition-all duration-300 ease-in-out";
          case 'body': return "text-base text-[#004d6b] leading-relaxed font-sans transition-all duration-300 ease-in-out";
          case 'accent': return "text-[#00aaff] transition-all duration-300 ease-in-out";
        }
        break;
      case 'tech':
        switch (variant) {
          case 'title': return "text-xl font-bold text-[#00F0FF] tracking-wider font-mono transition-all duration-300 ease-in-out";
          case 'subtitle': return "font-semibold text-[#D1D1D1] font-mono transition-all duration-300 ease-in-out";
          case 'body': return "text-base text-[#D1D1D1] leading-relaxed font-mono transition-all duration-300 ease-in-out";
          case 'accent': return "text-[#00F0FF] transition-all duration-300 ease-in-out";
        }
        break;
      case 'hi-tech':
        switch (variant) {
          case 'title': return "text-xl font-bold text-[#FFFFFF] tracking-widest uppercase transition-all duration-500 ease-in-out animate-pulse";
          case 'subtitle': return "font-semibold text-[#00FFFF] transition-all duration-500 ease-in-out";
          case 'body': return "text-base text-[#FFFFFF] leading-relaxed transition-all duration-500 ease-in-out";
          case 'accent': return "text-[#39FF14] transition-all duration-500 ease-in-out";
        }
        break;
      case 'construction':
        switch (variant) {
          case 'title': return "text-xl font-bold text-[#000000] tracking-wide font-mono uppercase transition-all duration-300 ease-in-out";
          case 'subtitle': return "font-semibold text-[#333333] font-mono transition-all duration-300 ease-in-out";
          case 'body': return "text-base text-[#333333] leading-relaxed font-mono transition-all duration-300 ease-in-out";
          case 'accent': return "text-[#FFCC00] transition-all duration-300 ease-in-out";
        }
        break;
      case 'mobile':
        switch (variant) {
          case 'title': return "text-sm font-medium text-gray-900 transition-all duration-200 ease-in-out";
          case 'subtitle': return "text-xs font-medium text-gray-800 transition-all duration-200 ease-in-out";
          case 'body': return "text-xs text-gray-600 leading-tight transition-all duration-200 ease-in-out";
          case 'accent': return "text-emerald-600 transition-all duration-200 ease-in-out";
        }
        break;
      default:
        switch (variant) {
          case 'title': return "text-lg font-semibold text-gray-900 transition-all duration-300 ease-in-out";
          case 'subtitle': return "font-medium text-gray-900 transition-all duration-300 ease-in-out";
          case 'body': return "text-sm text-gray-600 transition-all duration-300 ease-in-out";
          case 'accent': return "text-emerald-600 transition-all duration-300 ease-in-out";
        }
    }
  };

  const getButtonClasses = () => {
    switch (currentTheme) {
      case 'dark':
        return "flex items-center gap-2 px-4 py-2 bg-black text-[#00FF8C] rounded-lg " +
               "hover:bg-gradient-to-r hover:from-[#00FF8C] hover:to-[#00E676] hover:text-black " +
               "transition-all duration-300 border border-[#00FF8C] hover:shadow-[0_0_15px_rgba(0,255,140,0.5)]";
      case 'classic':
        return "flex items-center gap-2 px-4 py-2 bg-[#800000] text-white rounded-lg " +
               "hover:bg-[#A00000] transition-all duration-300 border border-[#800000] font-serif";
      case 'red-power':
        return "flex items-center gap-2 px-4 py-2 bg-[#c40021] text-white rounded-lg " +
               "hover:bg-[#a0001a] transition-all duration-300 border border-[#c40021] font-semibold";
      case 'luxury-black-gold':
        return "flex items-center gap-2 px-4 py-2 bg-transparent text-[#f5f5f5] rounded-lg " +
               "hover:bg-[#FFD700] hover:text-[#0f0f0f] transition-all duration-300 border border-[#FFD700] font-semibold";
      case 'eco-natural':
        return "flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#a5d6a7] to-[#81c784] text-white rounded-[8px] " +
               "hover:from-[#33691e] hover:to-[#558b2f] transition-all duration-300 border border-[#558b2f] font-semibold";
      case 'marine':
        return "flex items-center gap-2 px-4 py-2 bg-[#00aaff] text-white rounded-[12px] font-semibold " +
               "hover:bg-[#0099e6] hover:scale-105 transition-all duration-300 border border-[#00aaff] " +
               "hover:shadow-[0_4px_12px_rgba(0,170,255,0.3)]";
      case 'tech':
        return "flex items-center gap-2 px-4 py-2 bg-transparent text-[#00F0FF] rounded-[8px] font-mono font-bold " +
               "border border-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#1A1A1D] " +
               "transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]";
      case 'hi-tech':
        return "flex items-center gap-2 px-4 py-2 bg-transparent text-[#00FFFF] rounded-[6px] font-bold uppercase tracking-wider " +
               "border-2 border-[#00FFFF] hover:bg-[#00FFFF] hover:text-[#0F0F0F] hover:border-[#39FF14] " +
               "transition-all duration-500 hover:shadow-[0_0_25px_rgba(0,255,255,0.6)] transform hover:scale-105";
      case 'construction':
        return "flex items-center gap-2 px-4 py-2 bg-[#333333] text-[#FFCC00] rounded-[4px] font-mono font-bold uppercase " +
               "border-2 border-[#FFCC00] hover:bg-[#FFCC00] hover:text-[#000000] " +
               "transition-all duration-300 hover:shadow-[0_4px_8px_rgba(0,0,0,0.3)] transform hover:scale-105";
      case 'mobile':
        return "flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white rounded text-xs " +
               "hover:bg-emerald-600 transition-all duration-200 font-medium";
      default:
        return "flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors";
    }
  };

  const getFinancialBlockClasses = () => {
    switch (currentTheme) {
      case 'dark':
        return "bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-lg p-4 border border-[#00FF8C] transition-all duration-300 ease-in-out";
      case 'classic':
        return "bg-white rounded-lg p-4 border-2 border-[#C2A85D] shadow-sm transition-all duration-300 ease-in-out";
      case 'red-power':
        return "bg-white rounded-lg p-4 border-2 border-[#c40021] shadow-[0_2px_8px_rgba(196,0,33,0.15)] transition-all duration-300 ease-in-out";
      case 'luxury-black-gold':
        return "bg-[#0f0f0f] rounded-lg p-4 border-2 border-[#FFD700] shadow-[0_4px_12px_rgba(255,215,0,0.1)] transition-all duration-300 ease-in-out";
      case 'eco-natural':
        return "bg-[#f1f8e9] rounded-[8px] p-4 border-2 border-dashed border-[#a5d6a7] shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out";
      case 'marine':
        return "bg-gradient-to-br from-[#e6f7ff] to-[#cceeff] rounded-[12px] p-4 border-2 border-[#00aaff] shadow-[0_2px_6px_rgba(0,88,122,0.15)] transition-all duration-300 ease-in-out";
      case 'tech':
        return "bg-gradient-to-br from-[#2A2A2D] to-[#1A1A1D] rounded-[8px] p-4 border-2 border-[#00F0FF] shadow-[0_4px_16px_rgba(0,240,255,0.25)] transition-all duration-300 ease-in-out";
      case 'hi-tech':
        return "bg-gradient-to-br from-[#1E1E1E] to-[#0F0F0F] rounded-[6px] p-4 border-2 border-[#00FFFF] shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-500 ease-in-out hover:shadow-[0_0_30px_rgba(0,255,255,0.5)]";
      case 'construction':
        return "bg-gradient-to-br from-[#E8E8E8] to-[#D5D5D5] rounded-[4px] p-4 border-4 border-[#333333] shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 ease-in-out hover:shadow-[0_6px_16px_rgba(0,0,0,0.4)]";
      case 'mobile':
        return "bg-emerald-50 rounded p-2 border border-emerald-200 transition-all duration-200 ease-in-out";
      default:
        return "bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200 transition-all duration-300 ease-in-out";
    }
  };

  const getDropdownClasses = () => {
    switch (currentTheme) {
      case 'dark':
        return "bg-[#121212] border border-[#00FF8C] text-[#00FF8C] transition-all duration-300 ease-in-out";
      case 'classic':
        return "bg-white border border-[#DDDDDD] text-[#333333] transition-all duration-300 ease-in-out";
      case 'red-power':
        return "bg-white border border-[#c40021] text-[#c40021] transition-all duration-300 ease-in-out";
      case 'luxury-black-gold':
        return "bg-[#1a1a1a] border border-[#FFD700] text-[#FFD700] transition-all duration-300 ease-in-out";
      case 'eco-natural':
        return "bg-white border border-[#558b2f] text-[#2d572c] rounded-[8px] transition-all duration-300 ease-in-out";
      case 'marine':
        return "bg-white border border-[#00aaff] text-[#00587a] rounded-[12px] transition-all duration-300 ease-in-out";
      case 'tech':
        return "bg-[#1A1A1D] border border-[#00F0FF] text-[#00F0FF] rounded-[8px] font-mono transition-all duration-300 ease-in-out";
      case 'hi-tech':
        return "bg-[#0F0F0F] border-2 border-[#00FFFF] text-[#FFFFFF] rounded-[6px] font-bold uppercase tracking-wider transition-all duration-500 ease-in-out";
      case 'construction':
        return "bg-[#EDEDED] border-2 border-[#333333] text-[#000000] rounded-[4px] font-mono font-bold uppercase tracking-wide transition-all duration-300 ease-in-out";
      case 'mobile':
        return "bg-white border border-gray-300 text-gray-700 rounded text-xs transition-all duration-200 ease-in-out";
      default:
        return "bg-white border border-emerald-200 text-emerald-600 transition-all duration-300 ease-in-out";
    }
  };

  const getTotalClasses = () => {
    switch (currentTheme) {
      case 'dark':
        return "text-2xl font-bold text-[#00FF8C] transition-all duration-300 ease-in-out";
      case 'classic':
        return "text-2xl font-semibold text-[#800000] font-serif transition-all duration-300 ease-in-out";
      case 'red-power':
        return "text-2xl font-bold text-[#c40021] transition-all duration-300 ease-in-out";
      case 'luxury-black-gold':
        return "text-4xl font-bold text-[#FFD700] transition-all duration-300 ease-in-out";
      case 'eco-natural':
        return "text-3xl font-bold text-[#2d572c] transition-all duration-300 ease-in-out";
      case 'marine':
        return "text-3xl font-bold text-white font-sans transition-all duration-300 ease-in-out";
      case 'tech':
        return "text-3xl font-bold text-[#00F0FF] font-mono tracking-wider transition-all duration-300 ease-in-out";
      case 'hi-tech':
        return "text-4xl font-bold text-[#00FFFF] tracking-widest uppercase transition-all duration-500 ease-in-out animate-pulse";
      case 'construction':
        return "text-3xl font-bold text-[#000000] font-mono uppercase tracking-wide transition-all duration-300 ease-in-out";
      case 'mobile':
        return "text-base font-bold text-emerald-600 transition-all duration-200 ease-in-out";
      default:
        return "text-2xl font-bold text-emerald-600 transition-all duration-300 ease-in-out";
    }
  };

  const getFloorTypeText = () => {
    if (parameters.floors === '1 этаж' && parameters.firstFloorType) {
      return `Тип этажа: ${parameters.firstFloorType}`;
    }
    
    let floorTypes = [];
    if (parameters.floors === '2 этажа' || parameters.floors === '3 этажа') {
      if (parameters.secondFloorType) {
        floorTypes.push(`2-й этаж: ${parameters.secondFloorType}`);
      }
    }
    if (parameters.floors === '3 этажа' && parameters.thirdFloorType) {
      floorTypes.push(`3-й этаж: ${parameters.thirdFloorType}`);
    }
    
    return floorTypes.length > 0 ? floorTypes.join(', ') : '';
  };

  const copyToClipboard = async () => {
    const text = `
КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
Строительная компания HotWell.kz
По расчёту стоимости СИП дома в черновую отделку

ОСНОВНЫЕ ПАРАМЕТРЫ:
• Площадь застройки: ${area} м²
• Фундамент: ${parameters.foundation}
• Количество этажей: ${parameters.floors}
• ${getFloorTypeText()}
• Высота 1-го этажа: ${parameters.firstFloorHeight}, ${parameters.firstFloorThickness}
${parameters.floors === '2 этажа' || parameters.floors === '3 этажа' ? `• Высота 2-го этажа: ${parameters.secondFloorHeight}, ${parameters.secondFloorThickness}` : ''}
${parameters.floors === '3 этажа' ? `• Высота 3-го этажа: ${parameters.thirdFloorHeight}, ${parameters.thirdFloorThickness}` : ''}
• Перегородки: ${parameters.partitionType}
• Потолок: ${parameters.ceiling}
• Тип крыши: ${parameters.roofType}
• Форма дома: ${parameters.houseShape}

${(parameters.useCustomWorks && parameters.customWorks.some(work => work.name.trim() !== '')) || 
  (!parameters.useCustomWorks && parameters.additionalWorks !== 'Без дополнительных работ') ? 
  (parameters.useCustomWorks && parameters.customWorks.length > 0 ? `ДОПОЛНИТЕЛЬНЫЕ РАБОТЫ:
${parameters.customWorks.filter(work => work.name.trim() !== '').map(work => `• ${work.name}: ${formatPrice(typeof work.price === 'string' ? Number(work.price.replace(/\s/g, '')) : work.price)} ₸`).join('\n')}` : `ДОПОЛНИТЕЛЬНЫЕ РАБОТЫ:
• ${parameters.additionalWorks}`) : ''}

СТОИМОСТЬ:
${!hideFundamentCost ? `• Фундамент (14%): ${formatPrice(result.fundamentCost)} ₸\n` : ''}${!hideKitCost ? `• Домокомплект (71%): ${formatPrice(result.kitCost)} ₸\n` : ''}${!hideAssemblyCost ? `• Сборка (15%): ${formatPrice(result.assemblyCost)} ₸\n` : ''}${!hideDeliveryCost && parameters.deliveryCity && parameters.deliveryCity !== 'Выберите город доставки' && result.deliveryCost && result.deliveryCost > 0 ? `• Доставка (${parameters.deliveryCity}) - ${calculateTrucksNeeded(area)} фур${calculateTrucksNeeded(area) > 1 ? 'ы' : 'а'}: ${formatPrice(result.deliveryCost)} ₸\n` : ''}${options.isVatIncluded ? `• НДС 12%: ${formatPrice(Math.round((result.total / 1.12) * 0.12))} ₸\n` : ''}${options.isInstallment ? `• Рассрочка 13% (комиссия Kaspi): ${formatPrice(Math.round((options.installmentAmount > 0 ? options.installmentAmount : result.total) * 0.13))} ₸ (${options.installmentAmount > 0 ? `от ${formatPrice(options.installmentAmount)} ₸` : `от ${formatPrice(result.total)} ₸`})\n` : ''}

ИТОГО: ${formatPrice(result.total)} ₸ ${options.isVatIncluded ? 'с НДС' : 'без НДС'}

УСЛОВИЯ:
• Срок строительства: 30-45 дней
• Гарантия: 3 года
• Оплата: наличные / безналичные ${isInstallment ? '/ рассрочка' : ''}

HotWell.kz - Быстровозводимые дома из СИП-панелей по всей Республике Казахстан
    `;

    try {
      await navigator.clipboard.writeText(text.trim());
      alert('Коммерческое предложение скопировано в буфер обмена!');
    } catch (err) {
      console.error('Ошибка копирования:', err);
      alert('Не удалось скопировать текст');
    }
  };

  // Отдельный ref для PDF экспорта (без селектора тем)
  const pdfExportRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async () => {
    try {
      // Проверяем наличие данных
      if (result.total === 0 || !area) {
        alert('Пожалуйста, сначала заполните калькулятор и получите расчет стоимости');
        return;
      }

      if (!pdfExportRef.current) {
        alert('Ошибка: PDF блок не найден');
        return;
      }

      // Показываем процесс
      const originalText = document.querySelector('#pdf-export-btn')?.textContent;
      const exportBtn = document.querySelector('#pdf-export-btn');
      if (exportBtn) {
        exportBtn.textContent = 'Создание PDF...';
      }

      // Ждем полной отрисовки
      await new Promise(resolve => setTimeout(resolve, 300));

      // Динамический импорт html2pdf.js
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;

      // Создаем дату для имени файла
      const currentDate = new Date();
      const dateStr = currentDate.toLocaleDateString('ru-RU').replace(/\./g, '-');
      const filename = `Коммерческое_предложение_HotWell_${dateStr}.pdf`;

      // Улучшенные настройки для PDF
      const pdfOptions = {
        margin: [10, 10, 15, 10], // top, left, bottom, right в мм
        filename: filename,
        image: { 
          type: 'jpeg', 
          quality: 0.95 
        },
        html2canvas: { 
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          letterRendering: true,
          onclone: (clonedDoc: Document) => {
            // Убираем анимации и переходы в клонированном документе
            const style = clonedDoc.createElement('style');
            style.textContent = `
              *, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: '.page-break-avoid'
        }
      };

      console.log('Начинаем экспорт PDF...', pdfExportRef.current);

      // Экспортируем в PDF напрямую из видимого элемента
      await html2pdf()
        .set(pdfOptions)
        .from(pdfExportRef.current)
        .toPdf()
        .get('pdf')
        .then((pdf: any) => {
          // Добавляем подпись на последнюю страницу
          const totalPages = pdf.internal.getNumberOfPages();
          pdf.setPage(totalPages);
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text('Сформировано в системе HotWell.kz', 150, 285);
        })
        .save();

      console.log('PDF успешно сохранен:', filename);
      
      // Восстанавливаем текст кнопки
      if (exportBtn && originalText) {
        exportBtn.textContent = originalText;
      }

    } catch (error) {
      console.error('Ошибка при экспорте в PDF:', error);
      alert('Ошибка при создании PDF файла. Попробуйте еще раз.');
      
      // Восстанавливаем текст кнопки
      const exportBtn = document.querySelector('#pdf-export-btn');
      if (exportBtn) {
        exportBtn.textContent = currentTheme === 'mobile' ? 'Экспорт в PDF' : 'Экспорт в PDF';
      }
    }
  };

  if (result.total === 0) {
    return null;
  }

  return (
    <>
      <div 
        ref={commercialProposalRef}
        id="commercial-proposal"
        className={`mt-12 max-w-4xl mx-auto ${
          currentTheme === 'classic' ? 'bg-[#F4F4F4] p-6 rounded-lg' : 
          currentTheme === 'red-power' ? 'bg-[#fff5f5] p-6 rounded-lg' :
          currentTheme === 'luxury-black-gold' ? 'bg-[#0f0f0f] p-6 rounded-lg' :
          currentTheme === 'eco-natural' ? 'bg-[#fdfcf6] p-6 rounded-lg' :
          currentTheme === 'marine' ? 'bg-[#f0f8ff] p-6 rounded-lg' :
          currentTheme === 'tech' ? 'bg-[#0f0f0f] p-6 rounded-lg' :
          currentTheme === 'hi-tech' ? 'bg-[#000000] p-6 rounded-lg shadow-[0_0_40px_rgba(0,255,255,0.3)]' :
          currentTheme === 'construction' ? 'bg-[#F0F0F0] p-6 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.2)]' :
          currentTheme === 'mobile' ? 'bg-white p-1' : ''
        }`}
      >
        {/* Селектор темы */}
        <div className={`${currentTheme === 'mobile' ? 'mb-2' : 'mb-4'} flex justify-end`}>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center ${currentTheme === 'mobile' ? 'gap-1 px-2 py-1' : 'gap-2 px-4 py-2'} rounded-lg transition-all duration-300 ${getDropdownClasses()}`}
            >
              <Palette className={`${currentTheme === 'mobile' ? 'w-3 h-3' : 'w-4 h-4'}`} />
              {currentTheme === 'mobile' ? 'Темы' : themes.find(theme => theme.id === currentTheme)?.name}
              <ChevronDown className={`${currentTheme === 'mobile' ? 'w-3 h-3' : 'w-4 h-4'} transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className={`absolute right-0 ${currentTheme === 'mobile' ? 'mt-1 w-48' : 'mt-2 w-64'} rounded-lg shadow-lg z-50 ${
                currentTheme === 'dark' 
                  ? 'bg-[#1a1a1a] border border-[#2A2A2A]' 
                  : currentTheme === 'classic'
                  ? 'bg-white border border-[#DDDDDD]'
                  : currentTheme === 'red-power'
                  ? 'bg-white border border-[#ffccd5]'
                  : currentTheme === 'luxury-black-gold'
                  ? 'bg-[#1a1a1a] border border-[#333333]'
                  : currentTheme === 'eco-natural'
                  ? 'bg-white border border-[#d4e1d4]'
                  : currentTheme === 'marine'
                  ? 'bg-white border border-[#b3e0ff]'
                  : currentTheme === 'tech'
                  ? 'bg-[#1A1A1D] border border-[#00F0FF]'
                  : currentTheme === 'hi-tech'
                  ? 'bg-[#0F0F0F] border-2 border-[#00FFFF]'
                  : currentTheme === 'construction'
                  ? 'bg-[#EDEDED] border-2 border-[#333333]'
                  : currentTheme === 'mobile'
                  ? 'bg-white border border-gray-300'
                  : 'bg-white border border-gray-200'
              }`}>
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => changeTheme(theme.id)}
                    className={`w-full text-left ${currentTheme === 'mobile' ? 'px-2 py-2' : 'px-4 py-3'} hover:opacity-80 transition-opacity border-b last:border-b-0 ${
                      currentTheme === 'dark'
                        ? 'text-white border-[#2A2A2A] hover:bg-[#2A2A2A]'
                        : currentTheme === 'classic'
                        ? 'text-[#333333] border-[#DDDDDD] hover:bg-[#F4F4F4]'
                        : currentTheme === 'red-power'
                        ? 'text-[#c40021] border-[#ffccd5] hover:bg-[#ffccd5]'
                        : currentTheme === 'luxury-black-gold'
                        ? 'text-[#f5f5f5] border-[#333333] hover:bg-[#333333]'
                        : currentTheme === 'eco-natural'
                        ? 'text-[#2d572c] border-[#d4e1d4] hover:bg-[#e9f5e1]'
                        : currentTheme === 'marine'
                        ? 'text-[#00587a] border-[#b3e0ff] hover:bg-[#cceeff]'
                        : currentTheme === 'tech'
                        ? 'text-[#00F0FF] border-[#333333] hover:bg-[#2A2A2D] font-mono'
                        : currentTheme === 'hi-tech'
                        ? 'text-[#FFFFFF] border-[#333333] hover:bg-[#1E1E1E] font-bold uppercase tracking-wider hover:text-[#00FFFF]'
                        : currentTheme === 'construction'
                        ? 'text-[#000000] border-[#333333] hover:bg-[#D5D5D5] font-mono font-bold uppercase tracking-wide hover:text-[#FFCC00]'
                        : currentTheme === 'mobile'
                        ? 'text-gray-700 border-gray-200 hover:bg-gray-50'
                        : 'text-gray-700 border-gray-100 hover:bg-gray-50'
                    } ${currentTheme === theme.id ? 'font-semibold bg-opacity-20' : ''}`}
                  >
                    <div className={`flex items-center ${currentTheme === 'mobile' ? 'gap-1' : 'gap-2'} ${
                      theme.id === 'classic' ? 'font-serif' : 
                      theme.id === 'red-power' ? 'font-semibold' : 
                      theme.id === 'luxury-black-gold' ? 'font-semibold' : 
                      theme.id === 'eco-natural' ? 'font-semibold' : 
                      theme.id === 'marine' ? 'font-semibold' : 
                      theme.id === 'tech' ? 'font-mono' : 
                      theme.id === 'hi-tech' ? 'font-bold uppercase tracking-wider' : 
                      theme.id === 'construction' ? 'font-mono font-bold uppercase tracking-wide' : ''
                    }`}>
                      {currentTheme === theme.id && <span className="text-green-500">✓</span>}
                      <div>
                        <div className={`${currentTheme === 'mobile' ? 'text-xs' : ''} font-medium`}>{theme.name}</div>
                        {currentTheme !== 'mobile' && (
                          <div className={`text-xs mt-1 ${
                            currentTheme === 'dark' ? 'text-[#CCCCCC]' : 
                            currentTheme === 'classic' ? 'text-[#666666]' :
                            currentTheme === 'red-power' ? 'text-[#c40021]' :
                            currentTheme === 'luxury-black-gold' ? 'text-[#f5f5f5]' :
                            currentTheme === 'eco-natural' ? 'text-[#4e4e4e]' :
                            currentTheme === 'marine' ? 'text-[#00587a]' :
                            currentTheme === 'tech' ? 'text-[#D1D1D1]' :
                            currentTheme === 'hi-tech' ? 'text-[#00FFFF]' : 
                            currentTheme === 'construction' ? 'text-[#333333]' : 'text-gray-500'
                          }`}>
                            {theme.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PDF Export Block - без селектора тем */}
        <div 
          ref={pdfExportRef}
          className={getContainerClasses()}
          style={{ backgroundColor: currentTheme === 'dark' || currentTheme === 'hi-tech' || currentTheme === 'tech' || currentTheme === 'luxury-black-gold' ? '#ffffff' : undefined }}
        >
          {/* Заголовок */}
          <div className={getHeaderClasses()}>
            <div className="flex flex-col items-center justify-center">
              {/* Логотип */}
              <div className={`${currentTheme === 'mobile' ? 'mb-2' : 'mb-4'}`}>
                <img 
                  src="https://hotwell.kz/wp-content/uploads/2021/01/Logotip-hotwell.kz_.png" 
                  alt="HotWell.kz Логотип"
                  className={`${currentTheme === 'mobile' ? 'max-h-[60px]' : 'max-h-[120px] md:max-h-[150px]'} w-auto object-contain ${
                    currentTheme === 'dark' ? 'filter invert brightness-0 contrast-100' : 
                    currentTheme === 'classic' ? 'filter grayscale(0.3) contrast(1.1)' : 
                    currentTheme === 'red-power' ? 'filter invert brightness-0 contrast-100' :
                    currentTheme === 'luxury-black-gold' ? 'filter drop-shadow-[0_0_10px_rgba(255,215,0,0.7)] brightness-1.2 contrast-1.1' :
                    currentTheme === 'eco-natural' ? 'filter brightness-1.1 contrast-1.05' :
                    currentTheme === 'marine' ? 'filter brightness-1.1 contrast-1.05' :
                    currentTheme === 'tech' ? 'filter invert brightness-0 contrast-100 drop-shadow-[0_0_10px_rgba(0,240,255,0.7)]' :
                    currentTheme === 'hi-tech' ? 'filter invert brightness-0 contrast-100 drop-shadow-[0_0_15px_rgba(0,255,255,0.9)] animate-pulse' : 
                    currentTheme === 'construction' ? 'filter contrast-1.2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' : ''
                  }`}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              
              {/* Заголовок предложения */}
              <h2 className={`${currentTheme === 'mobile' ? 'text-sm font-medium mb-1' : 'text-xl md:text-2xl font-semibold mb-2'} ${
                currentTheme === 'dark' ? 'text-[#00FF8C] tracking-wide text-2xl md:text-3xl' : 
                currentTheme === 'classic' ? 'text-[#333333] font-serif text-2xl md:text-3xl' : 
                currentTheme === 'red-power' ? 'text-white font-bold tracking-wide text-2xl md:text-3xl' :
                currentTheme === 'luxury-black-gold' ? 'text-[#FFD700] font-bold tracking-wide text-2xl md:text-3xl uppercase' :
                currentTheme === 'eco-natural' ? 'text-[#2d572c] font-bold tracking-wide text-2xl md:text-3xl' :
                currentTheme === 'marine' ? 'text-white font-bold tracking-wide text-2xl md:text-3xl' :
                currentTheme === 'tech' ? 'text-[#00F0FF] font-bold tracking-wider text-2xl md:text-3xl font-mono uppercase' :
                currentTheme === 'hi-tech' ? 'text-[#FFFFFF] font-bold tracking-widest text-3xl md:text-4xl uppercase animate-pulse' : 
                currentTheme === 'construction' ? 'text-[#000000] font-mono font-bold tracking-widest text-3xl md:text-4xl uppercase' :
                currentTheme === 'mobile' ? 'text-white' : ''
              }`}>
                КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
              </h2>
              
              {/* Подзаголовок */}
              <p className={`${currentTheme === 'mobile' ? 'text-xs max-w-xs' : 'text-sm md:text-base max-w-md'} ${
                currentTheme === 'dark' ? 'text-[#CCCCCC] leading-relaxed text-base md:text-lg' : 
                currentTheme === 'classic' ? 'text-[#666666] leading-relaxed text-base md:text-lg font-serif' :
                currentTheme === 'red-power' ? 'text-[#ffe4e6] leading-relaxed text-base md:text-lg' :
                currentTheme === 'luxury-black-gold' ? 'text-[#d4af37] leading-relaxed text-base md:text-lg' :
                currentTheme === 'eco-natural' ? 'text-[#558b2f] leading-relaxed text-base md:text-lg' :
                currentTheme === 'marine' ? 'text-[#004d6b] leading-relaxed text-base md:text-lg' :
                currentTheme === 'tech' ? 'text-[#D1D1D1] leading-relaxed text-base md:text-lg font-mono' :
                currentTheme === 'hi-tech' ? 'text-[#00FFFF] leading-relaxed text-base md:text-lg uppercase tracking-wide' :
                currentTheme === 'construction' ? 'text-[#333333] leading-relaxed text-base md:text-lg font-mono font-semibold' :
                currentTheme === 'mobile' ? 'text-white leading-tight' : 'text-emerald-100'
              }`}>
                По расчёту стоимости СИП дома в черновую отделку
              </p>
            </div>
          </div>

          {/* Контент */}
          <div className={`${currentTheme === 'mobile' ? 'p-2 space-y-3' : 'p-6 space-y-6'} ${
            currentTheme === 'dark' ? 'bg-[#121212]' : 
            currentTheme === 'classic' ? 'bg-white' : 
            currentTheme === 'red-power' ? 'bg-white' :
            currentTheme === 'luxury-black-gold' ? 'bg-[#0f0f0f]' :
            currentTheme === 'eco-natural' ? 'bg-[#fdfcf6]' :
            currentTheme === 'marine' ? 'bg-[#f0f8ff]' :
            currentTheme === 'tech' ? 'bg-[#1A1A1D]' :
            currentTheme === 'hi-tech' ? 'bg-[#0F0F0F]' :
            currentTheme === 'construction' ? 'bg-[#F0F0F0]' :
            currentTheme === 'mobile' ? 'bg-white' : ''
          }`}>
            {/* Основные параметры */}
            <div>
              <div className={`flex items-center ${currentTheme === 'mobile' ? 'mb-2' : 'mb-4'}`}>
                <Building className={`${currentTheme === 'mobile' ? 'w-3 h-3 mr-1' : 'w-5 h-5 mr-2'} ${
                  currentTheme === 'dark' ? 'text-[#00FF8C]' : 
                  currentTheme === 'classic' ? 'text-[#800000]' : 
                  currentTheme === 'red-power' ? 'text-[#c40021]' :
                  currentTheme === 'luxury-black-gold' ? 'text-[#FFD700]' :
                  currentTheme === 'eco-natural' ? 'text-[#33691e]' :
                  currentTheme === 'marine' ? 'text-[#00aaff]' :
                  currentTheme === 'tech' ? 'text-[#00F0FF]' :
                  currentTheme === 'hi-tech' ? 'text-[#00FFFF]' :
                  currentTheme === 'construction' ? 'text-[#FFCC00]' : 'text-emerald-600'
                }`} />
                <h3 className={getTextClasses('title')}>
                  {currentTheme === 'eco-natural' ? '🌿 ' : currentTheme === 'marine' ? '🌊 ' : currentTheme === 'tech' ? '⚡ ' : currentTheme === 'hi-tech' ? '💎 ' : currentTheme === 'construction' ? '🛠 ' : ''}Основные параметры
                </h3>
              </div>
              <div className={`${currentTheme === 'mobile' ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-1 md:grid-cols-2 gap-4'} ${getSectionClasses()}`}>
                <div className={`${currentTheme === 'mobile' ? 'space-y-1' : 'space-y-2'}`}>
                  <p className={getTextClasses('body')}><span className={getTextClasses('subtitle')}>Площадь застройки:</span> {area} м²</p>
                  <p className={getTextClasses('body')}><span className={getTextClasses('subtitle')}>Фундамент:</span> {parameters.foundation}</p>
                  <p className={getTextClasses('body')}><span className={getTextClasses('subtitle')}>Количество этажей:</span> {parameters.floors}</p>
                  {getFloorTypeText() && (
                    <p className={`${getTextClasses('body')}`}><span className={getTextClasses('subtitle')}>{getFloorTypeText()}</span></p>
                  )}
                  <p className={getTextClasses('body')}><span className={getTextClasses('subtitle')}>Высота 1-го этажа:</span> {parameters.firstFloorHeight}, {parameters.firstFloorThickness}</p>
                  {parameters.floors === '2 этажа' || parameters.floors === '3 этажа' ? (
                    <p className={getTextClasses('body')}><span className={getTextClasses('subtitle')}>Высота 2-го этажа:</span> {parameters.secondFloorHeight}, {parameters.secondFloorThickness}</p>
                  ) : null}
                  {parameters.floors === '3 этажа' ? (
                    <p className={getTextClasses('body')}><span className={getTextClasses('subtitle')}>Высота 3-го этажа:</span> {parameters.thirdFloorHeight}, {parameters.thirdFloorThickness}</p>
                  ) : null}
                </div>
                {currentTheme !== 'mobile' && (
                  <div className="space-y-2">
                    <p className={getTextClasses('body')}><span className={getTextClasses('subtitle')}>Перегородки:</span> {parameters.partitionType}</p>
                    <p className={getTextClasses('body')}><span className={getTextClasses('subtitle')}>Потолок:</span> {parameters.ceiling}</p>
                    <p className={getTextClasses('body')}><span className={getTextClasses('subtitle')}>Тип крыши:</span> {parameters.roofType}</p>
                    <p className={getTextClasses('body')}><span className={getTextClasses('subtitle')}>Форма дома:</span> {parameters.houseShape}</p>
                  </div>
                )}
                {currentTheme === 'mobile' && (
                  <div className="space-y-1">
                    <p className={getTextClasses('body')}><span className={getTextClasses('subtitle')}>Перегородки:</span> {parameters.partitionType}</p>
                    <p className={getTextClasses('body')}><span className={getTextClasses('subtitle')}>Потолок:</span> {parameters.ceiling}</p>
                    <p className={getTextClasses('body')}><span className={getTextClasses('subtitle')}>Тип крыши:</span> {parameters.roofType}</p>
                    <p className={getTextClasses('body')}><span className={getTextClasses('subtitle')}>Форма дома:</span> {parameters.houseShape}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Дополнительные работы */}
            {(parameters.useCustomWorks && parameters.customWorks.some(work => work.name.trim() !== '')) || 
             (!parameters.useCustomWorks && parameters.additionalWorks !== 'Без дополнительных работ') ? (
              <div>
                <div className={`flex items-center ${currentTheme === 'mobile' ? 'mb-2' : 'mb-4'}`}>
                  <Wrench className={`${currentTheme === 'mobile' ? 'w-3 h-3 mr-1' : 'w-5 h-5 mr-2'} ${
                    currentTheme === 'dark' ? 'text-[#00FF8C]' : 
                    currentTheme === 'classic' ? 'text-[#800000]' : 
                    currentTheme === 'red-power' ? 'text-[#c40021]' :
                    currentTheme === 'luxury-black-gold' ? 'text-[#FFD700]' :
                    currentTheme === 'eco-natural' ? 'text-[#33691e]' :
                    currentTheme === 'marine' ? 'text-[#00aaff]' :
                    currentTheme === 'tech' ? 'text-[#00F0FF]' :
                    currentTheme === 'hi-tech' ? 'text-[#00FFFF]' :
                    currentTheme === 'construction' ? 'text-[#FFCC00]' : 'text-emerald-600'
                  }`} />
                  <h3 className={getTextClasses('title')}>
                    {currentTheme === 'eco-natural' ? '🌿 ' : currentTheme === 'marine' ? '🌊 ' : currentTheme === 'tech' ? '⚡ ' : currentTheme === 'hi-tech' ? '💎 ' : currentTheme === 'construction' ? '🛠 ' : ''}Дополнительные работы
                  </h3>
                </div>
                <div className={getSectionClasses()}>
                  {parameters.useCustomWorks && parameters.customWorks.length > 0 ? (
                    <div className={`${currentTheme === 'mobile' ? 'space-y-1' : 'space-y-2'}`}>
                      {parameters.customWorks.filter(work => work.name.trim() !== '').map((work, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className={getTextClasses('body')}>{work.name}</span>
                          <span className={getTextClasses('subtitle')}>
                            {formatPrice(typeof work.price === 'string' 
                              ? Number(work.price.replace(/\s/g, '')) 
                              : work.price
                            )} ₸
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={getTextClasses('body')}>{parameters.additionalWorks}</p>
                  )}
                </div>
              </div>
            ) : null}

            {/* Финансовая часть */}
            <div>
              <h3 className={`${getTextClasses('title')} ${currentTheme === 'mobile' ? 'mb-1' : 'mb-4'}`}>
                {currentTheme !== 'mobile' && (
                  currentTheme === 'eco-natural' ? '🌿 ' : 
                  currentTheme === 'marine' ? '🌊 ' : 
                  currentTheme === 'tech' ? '⚡ ' : 
                  currentTheme === 'hi-tech' ? '💎 ' : 
                  currentTheme === 'construction' ? '🛠 ' : ''
                )}Стоимость
              </h3>
              <div className={getFinancialBlockClasses()}>
                <div className={`${currentTheme === 'mobile' ? 'space-y-0 mb-1' : 'space-y-2 mb-4'} ${
                  currentTheme === 'classic' ? 'text-base' : 
                  currentTheme === 'dark' ? 'text-base' : 
                  currentTheme === 'red-power' ? 'text-base' : 
                  currentTheme === 'luxury-black-gold' ? 'text-lg' :
                  currentTheme === 'eco-natural' ? 'text-base' :
                  currentTheme === 'marine' ? 'text-base' :
                  currentTheme === 'tech' ? 'text-base' :
                  currentTheme === 'hi-tech' ? 'text-base' :
                  currentTheme === 'construction' ? 'text-base' :
                  currentTheme === 'mobile' ? 'text-xs' : 'text-sm'
                }`}>
                  {!hideFundamentCost && (
                    <div className="flex justify-between">
                      <span className={getTextClasses('body')}>{currentTheme === 'mobile' ? '' : '🏗️ '}Фундамент{currentTheme === 'mobile' ? '' : ' (14%)'}</span>
                      <span className={getTextClasses('subtitle')}>{formatPrice(result.fundamentCost)} ₸</span>
                    </div>
                  )}
                  {!hideKitCost && (
                    <div className="flex justify-between">
                      <span className={getTextClasses('body')}>{currentTheme === 'mobile' ? '' : '🏠 '}Домокомплект{currentTheme === 'mobile' ? '' : ' (71%)'}</span>
                      <span className={getTextClasses('subtitle')}>{formatPrice(result.kitCost)} ₸</span>
                    </div>
                  )}
                  {!hideAssemblyCost && (
                    <div className="flex justify-between">
                      <span className={getTextClasses('body')}>{currentTheme === 'mobile' ? '' : '⚒️ '}Сборка{currentTheme === 'mobile' ? '' : ' (15%)'}</span>
                      <span className={getTextClasses('subtitle')}>{formatPrice(result.assemblyCost)} ₸</span>
                    </div>
                  )}
                  {/* Доставка - показываем только если выбран город и есть стоимость */}
                  {!hideDeliveryCost && parameters.deliveryCity && parameters.deliveryCity !== 'Выберите город доставки' && result.deliveryCost && result.deliveryCost > 0 && (
                    <div className="flex justify-between">
                      <span className={getTextClasses('body')}>
                        {currentTheme === 'mobile' ? '' : '🚚 '}
                        Доставка ({parameters.deliveryCity})
                        {currentTheme !== 'mobile' && ` - ${calculateTrucksNeeded(area)} фур${calculateTrucksNeeded(area) > 1 ? 'ы' : 'а'}`}
                      </span>
                      <span className={getTextClasses('subtitle')}>{formatPrice(result.deliveryCost)} ₸</span>
                    </div>
                  )}
                  {isVatIncluded && (
                    <div className={`flex justify-between ${currentTheme === 'mobile' ? 'border-t border-gray-200 pt-0' : 'border-t pt-2'} ${
                      currentTheme === 'dark' ? 'border-[#2A2A2A]' : 
                      currentTheme === 'classic' ? 'border-[#DDDDDD]' : 
                      currentTheme === 'red-power' ? 'border-[#ffccd5]' :
                      currentTheme === 'luxury-black-gold' ? 'border-[#FFD700]' :
                      currentTheme === 'eco-natural' ? 'border-[#d4e1d4]' :
                      currentTheme === 'marine' ? 'border-[#b3e0ff]' :
                      currentTheme === 'tech' ? 'border-[#00F0FF]' :
                      currentTheme === 'hi-tech' ? 'border-[#00FFFF]' :
                      currentTheme === 'construction' ? 'border-[#333333]' : 'border-emerald-300'
                    }`}>
                      <span className={getTextClasses('body')}>НДС 12%</span>
                      <span className={getTextClasses('subtitle')}>{formatPrice(Math.round((result.total / 1.12) * 0.12))} ₸</span>
                    </div>
                  )}
                  {isInstallment && (
                    <div className={`${currentTheme === 'mobile' ? 'border-t border-gray-200 pt-0' : 'border-t pt-2'} ${
                      currentTheme === 'dark' ? 'border-[#2A2A2A]' : 
                      currentTheme === 'classic' ? 'border-[#DDDDDD]' : 
                      currentTheme === 'red-power' ? 'border-[#ffccd5]' :
                      currentTheme === 'luxury-black-gold' ? 'border-[#FFD700]' :
                      currentTheme === 'eco-natural' ? 'border-[#d4e1d4]' :
                      currentTheme === 'marine' ? 'border-[#b3e0ff]' :
                      currentTheme === 'tech' ? 'border-[#00F0FF]' :
                      currentTheme === 'hi-tech' ? 'border-[#00FFFF]' :
                      currentTheme === 'construction' ? 'border-[#333333]' : 'border-emerald-300'
                    }`}>
                      <div className="flex justify-between">
                        <span className={getTextClasses('body')}>Рассрочка 13% (комиссия Kaspi)</span>
                        <div className="text-right">
                          <span className={getTextClasses('subtitle')}>{formatPrice(Math.round((options.installmentAmount > 0 ? options.installmentAmount : result.total) * 0.13))} ₸</span>
                          <div className={`${currentTheme === 'mobile' ? 'text-xs' : 'text-sm'} ${
                            currentTheme === 'dark' ? 'text-[#888888]' : 
                            currentTheme === 'classic' ? 'text-[#666666]' : 
                            currentTheme === 'red-power' ? 'text-[#888888]' :
                            currentTheme === 'luxury-black-gold' ? 'text-[#888888]' :
                            currentTheme === 'eco-natural' ? 'text-[#666666]' :
                            currentTheme === 'marine' ? 'text-[#666666]' :
                            currentTheme === 'tech' ? 'text-[#888888] font-mono' :
                            currentTheme === 'hi-tech' ? 'text-[#888888]' :
                            currentTheme === 'construction' ? 'text-[#666666] font-mono' : 'text-gray-500'
                          } ml-2`}>
                            {options.installmentAmount > 0 
                              ? `от ${formatPrice(options.installmentAmount)} ₸`
                              : `от ${formatPrice(result.total)} ₸`
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`${currentTheme === 'mobile' ? 'border-t border-emerald-300 pt-1' : 'border-t pt-4'} ${
                  currentTheme === 'dark' ? 'border-[#00FF8C]' : 
                  currentTheme === 'classic' ? 'border-[#C2A85D] border-2' : 
                  currentTheme === 'red-power' ? 'border-[#c40021] border-2' :
                  currentTheme === 'luxury-black-gold' ? 'border-[#FFD700] border-2' :
                  currentTheme === 'eco-natural' ? 'border-[#a5d6a7] border-2' :
                  currentTheme === 'marine' ? 'border-[#00aaff] border-2' :
                  currentTheme === 'tech' ? 'border-[#00F0FF] border-2' :
                  currentTheme === 'hi-tech' ? 'border-[#00FFFF] border-2' :
                  currentTheme === 'construction' ? 'border-[#333333] border-4' :
                  currentTheme === 'mobile' ? 'border-emerald-300' : 'border-emerald-300'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className={`${currentTheme === 'mobile' ? 'text-xs' : 'text-lg'} font-bold ${
                      currentTheme === 'dark' ? 'text-white' : 
                      currentTheme === 'classic' ? 'text-[#333333] font-serif' : 
                      currentTheme === 'red-power' ? 'text-[#c40021] font-semibold' :
                      currentTheme === 'luxury-black-gold' ? 'text-[#FFD700] font-semibold' :
                      currentTheme === 'eco-natural' ? 'text-[#2d572c] font-bold' :
                      currentTheme === 'marine' ? 'text-white font-bold' :
                      currentTheme === 'tech' ? 'text-[#00F0FF] font-bold font-mono' :
                      currentTheme === 'hi-tech' ? 'text-[#FFFFFF] font-bold uppercase tracking-wide' :
                      currentTheme === 'construction' ? 'text-[#000000] font-mono uppercase tracking-wide' : 'text-gray-900'
                    }`}>ИТОГО:</span>
                    <span className={getTotalClasses()}>
                      {formatPrice(result.total)} ₸
                    </span>
                  </div>
                  <p className={`text-right ${currentTheme === 'mobile' ? 'text-xs' : 'text-sm'} ${
                    currentTheme === 'dark' ? 'text-[#CCCCCC]' : 
                    currentTheme === 'classic' ? 'text-[#666666]' : 
                    currentTheme === 'red-power' ? 'text-[#c40021] font-semibold' :
                    currentTheme === 'luxury-black-gold' ? 'text-[#FFD700] font-semibold' :
                    currentTheme === 'eco-natural' ? 'text-[#2d572c] font-semibold' :
                    currentTheme === 'marine' ? 'text-[#003f5c] font-bold' :
                    currentTheme === 'tech' ? 'text-[#00F0FF] font-mono' :
                    currentTheme === 'hi-tech' ? 'text-[#00FFFF] font-bold uppercase tracking-wide' :
                    currentTheme === 'construction' ? 'text-[#333333] font-mono font-semibold' : 'text-gray-600'
                  }`}>
                    {isVatIncluded ? 'с НДС' : 'без НДС'}
                  </p>
                </div>
              </div>
            </div>

            {/* Условия */}
            <div>
              <h3 className={`${getTextClasses('title')} ${currentTheme === 'mobile' ? 'mb-1' : 'mb-4'}`}>
                {currentTheme !== 'mobile' && (
                  currentTheme === 'eco-natural' ? '🌿 ' : 
                  currentTheme === 'marine' ? '🌊 ' : 
                  currentTheme === 'tech' ? '⚡ ' : 
                  currentTheme === 'hi-tech' ? '💎 ' : 
                  currentTheme === 'construction' ? '🛠 ' : ''
                )}Условия
              </h3>
              <div className={getSectionClasses()}>
                <div className={`${currentTheme === 'mobile' ? 'grid grid-cols-1 gap-1' : 'grid grid-cols-1 md:grid-cols-3 gap-4'} ${
                  currentTheme === 'classic' ? 'text-base' : 
                  currentTheme === 'dark' ? 'text-base' : 
                  currentTheme === 'red-power' ? 'text-base' : 
                  currentTheme === 'luxury-black-gold' ? 'text-base' :
                  currentTheme === 'eco-natural' ? 'text-base' :
                  currentTheme === 'marine' ? 'text-base' :
                  currentTheme === 'tech' ? 'text-base' :
                  currentTheme === 'hi-tech' ? 'text-base' :
                  currentTheme === 'construction' ? 'text-base' :
                  currentTheme === 'mobile' ? 'text-xs' : 'text-sm'
                }`}>
                  <div>
                    <p className={getTextClasses('subtitle')}>{currentTheme === 'mobile' ? 'Срок' : 'Срок строительства'}</p>
                    <p className={getTextClasses('body')}>30-45 дней</p>
                  </div>
                  <div>
                    <p className={getTextClasses('subtitle')}>Гарантия</p>
                    <p className={getTextClasses('body')}>3 года</p>
                  </div>
                  <div>
                    <p className={getTextClasses('subtitle')}>Оплата</p>
                    <p className={getTextClasses('body')}>
                      {currentTheme === 'mobile' 
                        ? `наличные${isInstallment ? '/рассрочка' : ''}`
                        : `наличные / безналичные${isInstallment ? ' / рассрочка' : ''}`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Подвал */}
          <div className={`${currentTheme === 'mobile' ? 'px-1 py-1' : 'px-6 py-4'} ${
            currentTheme === 'dark' ? 'bg-[#1a1a1a] border-t border-[#2A2A2A]' : 
            currentTheme === 'classic' ? 'bg-[#FAFAFA] border-t border-[#DDDDDD]' : 
            currentTheme === 'red-power' ? 'bg-[#fff5f5] border-t border-[#ffccd5]' :
            currentTheme === 'luxury-black-gold' ? 'bg-[#1c1c1c] border-t border-[#333333]' :
            currentTheme === 'eco-natural' ? 'bg-[#e9f5e1] border-t border-[#d4e1d4]' :
            currentTheme === 'marine' ? 'bg-[#cceeff] border-t border-[#b3e0ff]' :
            currentTheme === 'tech' ? 'bg-[#2A2A2D] border-t border-[#00F0FF]' :
            currentTheme === 'hi-tech' ? 'bg-[#1E1E1E] border-t-2 border-[#00FFFF]' :
            currentTheme === 'construction' ? 'bg-[#EDEDED] border-t-4 border-[#333333]' :
            currentTheme === 'mobile' ? 'bg-gray-100 border-t border-gray-300' : 'bg-gray-100'
          }`}>
            <div className={`${currentTheme === 'mobile' ? 'flex flex-col items-center gap-1' : 'flex flex-col md:flex-row justify-between items-center gap-4'}`}>
              <div className={`${currentTheme === 'mobile' ? 'text-center' : 'text-center md:text-left'}`}>
                <p className={`${currentTheme === 'mobile' ? 'text-xs' : ''} font-semibold ${
                  currentTheme === 'dark' ? 'text-white' : 
                  currentTheme === 'classic' ? 'text-[#333333] font-serif' : 
                  currentTheme === 'red-power' ? 'text-[#c40021] font-bold' :
                  currentTheme === 'luxury-black-gold' ? 'text-[#FFD700] font-bold' :
                  currentTheme === 'eco-natural' ? 'text-[#2d572c] font-bold' :
                  currentTheme === 'marine' ? 'text-[#00587a] font-bold' :
                  currentTheme === 'tech' ? 'text-[#00F0FF] font-bold font-mono' :
                  currentTheme === 'hi-tech' ? 'text-[#FFFFFF] font-bold uppercase tracking-wider' :
                  currentTheme === 'construction' ? 'text-[#000000] font-mono font-bold uppercase tracking-wide' : 'text-gray-900'
                }`}>HotWell.kz</p>
                <p className={getTextClasses('body')}>
                  {currentTheme === 'mobile' 
                    ? 'СИП-панели по Казахстану' 
                    : 'Быстровозводимые дома из СИП-панелей по всей Республике Казахстан'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Плавающий блок с кнопками экспорта - НЕ попадает в PDF */}
      {result.total > 0 && (
        <div className="export-button-container fixed bottom-6 right-6 z-[1000] flex gap-3">
          {/* Кнопка копирования */}
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 
                     rounded-[10px] border border-gray-300 shadow-lg hover:shadow-xl
                     transition-all duration-300 hover:scale-105 font-medium"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Скопировать</span>
          </button>

          {/* Кнопка PDF экспорта */}
          <button
            id="pdf-export-btn"
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-3 bg-[#00b347] hover:bg-[#3BB143] text-white 
                     rounded-[10px] border border-[#00b347] shadow-lg hover:shadow-xl
                     transition-all duration-300 hover:scale-105 font-medium"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      )}
    </>
  );
};