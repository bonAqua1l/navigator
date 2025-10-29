import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Eye, Clock, CheckCircle, ArrowRight, Phone, Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import navigatorLogo from "@/assets/navigator-house-logo.png";
import { FeaturedPropertiesGrid } from "@/components/FeaturedPropertiesGrid";
import { ManagersSection } from "@/components/ManagersSection";
const Landing = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Parallax */}
      <motion.section
        style={{
          opacity: heroOpacity,
          scale: heroScale,
        }}
        className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-primary/90 min-h-[90vh] flex items-center"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzZ6bS0yIDBoLTJ2Mmgydi0yem0tMiAwdi0yaC0ydjJoMnptMC0yaDJ2LTJoLTJ2MnptMiAwVjMwaDJ2MmgtMnptMCAyaDJ2Mmgtdi0yem0yIDB2Mmgydi0yaC0yem0wLTJ2LTJoMnYyaC0yem0yLTJoMnYyaC0ydi0yem0wIDJ2Mmgydi0yaC0yem0yIDBoMnYyaC0ydi0yem0wLTJ2LTJoMnYyaC0yem0yLTJoMnYyaC0ydi0yem0wIDJ2Mmgydi0yaC0yem0yIDBoMnYyaC0ydi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>

        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            className="flex flex-col items-center text-center space-y-6 md:space-y-8 max-w-4xl mx-auto"
          >
            <motion.img
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.6,
                delay: 0.2,
              }}
              src={navigatorLogo}
              alt="Navigator House"
              className="h-48 md:h-48 w-auto mb-2 md:mb-4 drop-shadow-2xl"
            />

            <motion.h1
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.8,
                delay: 0.3,
              }}
              className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight"
            >
              Ваш навигатор в мире
              <br />
              <span className="text-amber-500">недвижимости</span>
            </motion.h1>

            <motion.p
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                duration: 0.8,
                delay: 0.5,
              }}
              className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-2xl px-4"
            >
              Профессиональное агентство недвижимости с командой опытных риелторов. Поможем найти, купить или продать
              вашу недвижимость
            </motion.p>

            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.7,
              }}
              className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 w-full sm:w-auto px-4"
            >
              <motion.div
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.95,
                }}
              >
                <Button
                  size="lg"
                  onClick={() => navigate("/properties")}
                  className="text-white px-6 md:px-8 py-5 md:py-6 text-base md:text-lg shadow-lg hover:shadow-xl transition-all w-full sm:w-auto bg-yellow-600 hover:bg-yellow-500"
                >
                  Смотреть объекты
                  <ArrowRight className="ml-2 h-4 md:h-5 w-4 md:w-5" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.95,
                }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("features")?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg backdrop-blur-sm w-full sm:w-auto"
                >
                  О компании
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Properties Grid */}
      <motion.div
        initial={{
          opacity: 0,
          y: 60,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          margin: "-100px",
        }}
        transition={{
          duration: 0.6,
        }}
      >
        <FeaturedPropertiesGrid />
      </motion.div>

      {/* Managers Section */}
      <motion.div
        initial={{
          opacity: 0,
          y: 60,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          margin: "-100px",
        }}
        transition={{
          duration: 0.6,
        }}
      >
        <ManagersSection />
      </motion.div>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{
              opacity: 0,
              y: 60,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              margin: "-100px",
            }}
            transition={{
              duration: 0.6,
            }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4 px-4">
              Почему выбирают нас?
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Профессиональный подход и комплексное обслуживание на всех этапах сделки
            </p>
          </motion.div>

          <motion.div
            initial={{}}
            whileInView={{
              transition: {
                staggerChildren: 0.1,
              },
            }}
            viewport={{
              once: true,
              margin: "-100px",
            }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 60,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.6,
              }}
            >
              <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg h-full">
                <CardContent className="pt-6 text-center space-y-3 md:space-y-4">
                  <motion.div
                    whileHover={{
                      scale: 1.1,
                      rotate: 5,
                    }}
                    className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto"
                  >
                    <Users className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                  </motion.div>
                  <h3 className="text-lg md:text-xl font-semibold">Команда профессионалов</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Опытные риелторы с глубоким знанием рынка недвижимости
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                y: 60,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.6,
                delay: 0.1,
              }}
            >
              <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg h-full">
                <CardContent className="pt-6 text-center space-y-3 md:space-y-4">
                  <motion.div
                    whileHover={{
                      scale: 1.1,
                      rotate: -5,
                    }}
                    className="w-14 h-14 md:w-16 md:h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto"
                  >
                    <Shield className="h-7 w-7 md:h-8 md:w-8 text-secondary" />
                  </motion.div>
                  <h3 className="text-lg md:text-xl font-semibold">Юридическая чистота</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Полная проверка документов и сопровождение сделки на всех этапах
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                y: 60,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.6,
                delay: 0.2,
              }}
            >
              <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg h-full">
                <CardContent className="pt-6 text-center space-y-3 md:space-y-4">
                  <motion.div
                    whileHover={{
                      scale: 1.1,
                      rotate: 5,
                    }}
                    className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto"
                  >
                    <Eye className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                  </motion.div>
                  <h3 className="text-lg md:text-xl font-semibold">Индивидуальный подход</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Персональный менеджер и организация показов в удобное время
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                y: 60,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.6,
                delay: 0.3,
              }}
            >
              <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg h-full">
                <CardContent className="pt-6 text-center space-y-3 md:space-y-4">
                  <motion.div
                    whileHover={{
                      scale: 1.1,
                      rotate: -5,
                    }}
                    className="w-14 h-14 md:w-16 md:h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto"
                  >
                    <Clock className="h-7 w-7 md:h-8 md:w-8 text-secondary" />
                  </motion.div>
                  <h3 className="text-lg md:text-xl font-semibold">Быстрые сделки</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Оперативный поиск покупателей и проведение сделок в короткие сроки
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{
                opacity: 0,
                y: 60,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                margin: "-100px",
              }}
              transition={{
                duration: 0.6,
              }}
              className="space-y-4 md:space-y-6"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground px-4 md:px-0">
                Полный спектр услуг
              </h2>
              <p className="text-base md:text-lg text-muted-foreground px-4 md:px-0">
                Navigator House — это ваш надежный партнер в мире недвижимости
              </p>

              <motion.div
                initial={{}}
                whileInView={{
                  transition: {
                    staggerChildren: 0.1,
                  },
                }}
                viewport={{
                  once: true,
                }}
                className="space-y-3 md:space-y-4 px-4 md:px-0"
              >
                {[
                  "Продажа и покупка квартир, домов, коммерческой недвижимости",
                  "Аренда жилой и коммерческой недвижимости",
                  "Юридическое сопровождение сделок",
                  "Помощь в оформлении ипотеки",
                  "Консультации по инвестициям в недвижимость",
                  "Оценка рыночной стоимости объектов",
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{
                      opacity: 0,
                      x: -20,
                    }}
                    whileInView={{
                      opacity: 1,
                      x: 0,
                    }}
                    viewport={{
                      once: true,
                    }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                    }}
                    whileHover={{
                      x: 10,
                    }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base text-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                y: 60,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                margin: "-100px",
              }}
              transition={{
                duration: 0.6,
              }}
              className="relative px-4 md:px-0"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl"></div>
              <Card className="relative bg-card border-2">
                <CardContent className="p-6 md:p-8">
                  <motion.div
                    initial={{}}
                    whileInView={{
                      transition: {
                        staggerChildren: 0.15,
                      },
                    }}
                    viewport={{
                      once: true,
                    }}
                    className="space-y-4 md:space-y-6"
                  >
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 20,
                      }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      className="flex items-center gap-3 md:gap-4"
                    >
                      <motion.div
                        whileHover={{
                          rotate: 360,
                        }}
                        transition={{
                          duration: 0.5,
                        }}
                        className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0"
                      >
                        <Users className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
                      </motion.div>
                      <div>
                        <h4 className="font-semibold text-base md:text-lg">Опыт</h4>
                        <p className="text-xs md:text-sm text-muted-foreground">Более 10 лет на рынке</p>
                      </div>
                    </motion.div>
                    <div className="h-px bg-border"></div>
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 20,
                      }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay: 0.15,
                      }}
                      className="flex items-center gap-3 md:gap-4"
                    >
                      <motion.div
                        whileHover={{
                          rotate: 360,
                        }}
                        transition={{
                          duration: 0.5,
                        }}
                        className="w-10 h-10 md:w-12 md:h-12 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0"
                      >
                        <Shield className="h-5 w-5 md:h-6 md:w-6 text-secondary-foreground" />
                      </motion.div>
                      <div>
                        <h4 className="font-semibold text-base md:text-lg">Надежность</h4>
                        <p className="text-xs md:text-sm text-muted-foreground">1000+ успешных сделок</p>
                      </div>
                    </motion.div>
                    <div className="h-px bg-border"></div>
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 20,
                      }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay: 0.3,
                      }}
                      className="flex items-center gap-3 md:gap-4"
                    >
                      <motion.div
                        whileHover={{
                          rotate: 360,
                        }}
                        transition={{
                          duration: 0.5,
                        }}
                        className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0"
                      >
                        <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
                      </motion.div>
                      <div>
                        <h4 className="font-semibold text-base md:text-lg">Качество</h4>
                        <p className="text-xs md:text-sm text-muted-foreground">Индивидуальный подход</p>
                      </div>
                    </motion.div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Contacts Section */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-12 md:py-20 bg-muted/30"
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4 px-4">Контакты</h2>
            <p className="text-base md:text-xl text-muted-foreground px-4">Свяжитесь с нами любым удобным способом</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-10 items-start">
            {/* Left: Phone Numbers and Instagram */}
            <motion.div
              initial={{}}
              whileInView={{ transition: { staggerChildren: 0.1 } }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {/* Phone Numbers */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-3"
              >
                {["+996 506 990 199", "+996 506 991 099", "+996 506 990 599", "+996 506 990 799"].map(
                  (phone, index) => {
                    const cleanPhone = phone.replace(/\s/g, "");
                    const whatsappLink = `https://wa.me/${cleanPhone.replace("+", "")}`;
                    return (
                      <motion.a
                        key={index}
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ x: 10, scale: 1.02 }}
                        className="flex items-center gap-3 md:gap-4 p-4 bg-card border-2 border-border hover:border-green-500/50 rounded-lg transition-all group"
                      >
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
                          <Phone className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                        </div>
                        <span className="text-base md:text-lg font-medium text-foreground">{phone}</span>
                      </motion.a>
                    );
                  },
                )}
              </motion.div>

              {/* Instagram Link */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="pt-4"
              >
                <motion.a
                  href="https://www.instagram.com/navigatorhouse?igsh=b3E3dWZzOGw2bnFq"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center gap-3 p-5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <Instagram className="h-6 w-6" />
                  <span className="text-lg font-semibold">Мы в Instagram</span>
                </motion.a>
              </motion.div>
            </motion.div>

            {/* Right: 2GIS Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full h-[400px] md:h-[450px] rounded-xl overflow-hidden shadow-lg"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d182.8670441593539!2d74.63967833422474!3d42.83330263457077!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x389eb67d8eaf5739%3A0xa19fbf757fc240d1!2zMiDRg9C70LjRhtCwINCc0L7Qu9C00L7QutGD0LvQvtCy0LAsINCR0LjRiNC60LXQug!5e0!3m2!1sru!2skg!4v1761415987422!5m2!1sru!2skg"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{
          opacity: 0,
          y: 60,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          margin: "-100px",
        }}
        transition={{
          duration: 0.6,
        }}
        className="py-12 md:py-20 bg-gradient-to-br from-primary via-primary-hover to-primary/90 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzZ6bS0yIDBoLTJ2Mmgydi0yem0tMiAwdi0yaC0ydjJoMnptMC0yaDJ2LTJoLTJ2MnptMiAwVjMwaDJ2MmgtMnptMCAyaDJ2Mmgtdi0yem0yIDB2Mmgydi0yaC0yem0wLTJ2LTJoMnYyaC0yem0yLTJoMnYyaC0ydi0yem0wIDJ2Mmgydi0yaC0yem0yIDBoMnYyaC0ydi0yem0wLTJ2LTJoMnYyaC0yem0yLTJoMnYyaC0ydi0yem0wIDJ2Mmgydi0yaC0yem0yIDBoMnYyaC0ydi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.6,
              delay: 0.2,
            }}
            className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white px-4">
              Готовы найти недвижимость мечты?
            </h2>
            <p className="text-base md:text-xl text-white/90 px-4">Наши специалисты помогут вам на каждом этапе</p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <motion.div
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.95,
                }}
              >
                <Button
                  size="lg"
                  onClick={() => navigate("/properties")}
                  className="px-8 md:px-10 py-6 md:py-7 text-lg md:text-xl shadow-2xl hover:shadow-secondary/50 transition-all w-full sm:w-auto text-yellow-50 bg-yellow-600 hover:bg-yellow-500"
                >
                  Смотреть объекты
                  <ArrowRight className="ml-2 h-5 md:h-6 w-5 md:w-6" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.95,
                }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-8 md:px-10 py-6 md:py-7 text-lg md:text-xl backdrop-blur-sm w-full sm:w-auto"
                >
                  Войти
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{
          opacity: 0,
        }}
        whileInView={{
          opacity: 1,
        }}
        viewport={{
          once: true,
        }}
        className="bg-muted/50 py-8 md:py-12"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <motion.div
              whileHover={{
                scale: 1.05,
              }}
              className="flex items-center gap-3"
            >
              <img src={navigatorLogo} alt="Navigator House" className="h-10 md:h-12 w-auto" />
              <div>
                <h3 className="font-semibold text-base md:text-lg">Navigator House</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Навигатор в мире недвижимости</p>
              </div>
            </motion.div>

            <div className="text-center md:text-right">
              <p className="text-sm md:text-base text-muted-foreground">© 2024 Navigator House. Все права защищены.</p>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};
export default Landing;
