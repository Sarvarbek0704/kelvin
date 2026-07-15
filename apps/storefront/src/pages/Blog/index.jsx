import React from "react";
import blog1 from "../../assets/blog1.png";
import blog2 from "../../assets/blog2.png";
import blog3 from "../../assets/blog3.png";
import {
  BlogContainer,
  BlogHeader,
  BlogTitle,
  BlogButton,
  BlogContent,
  BlogCard,
  BlogImage,
  BlogCardCenter,
  BlogCardTitle,
  BlogCardDate,
  ArrowIcon,
  BreadcrumbLink,
  BreadcrumbSpan,
} from "./Blog.styled";
import ArrowTopIcon from "../../components/icons/src/ArrowTop.icon";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";

function Blog() {
  const blogPosts = [
    {
      id: 1,
      image: blog1,
      title: "Как правильно освещать дом снаружи?",
      date: "01.01.2024",
    },
    {
      id: 2,
      image: blog2,
      title: "Как правильно освещать дом снаружи?",
      date: "01.01.2024",
    },
    {
      id: 3,
      image: blog3,
      title: "Как правильно освещать дом снаружи?",
      date: "01.01.2024",
    },
  ];

  return (
    <div>
      <Navbar />
      <BlogContainer>
        <div className="BreadCrumb">
          <BreadcrumbLink href="/">Главная {" >"}</BreadcrumbLink>
          <BreadcrumbSpan> Блог</BreadcrumbSpan>
        </div>
        <BlogHeader>
          <BlogTitle>Блог</BlogTitle>
        </BlogHeader>
        <BlogContent>
          {blogPosts.map((post) => (
            <BlogCard key={post.id}>
              <BlogImage src={post.image} alt={post.title} />
              <BlogCardCenter>
                <BlogCardTitle>{post.title}</BlogCardTitle>
                <ArrowIcon>
                  <ArrowTopIcon color="rgba(0, 0, 0, 1)" />
                </ArrowIcon>
              </BlogCardCenter>
              <BlogCardDate>{post.date}</BlogCardDate>
            </BlogCard>
          ))}
        </BlogContent>
        <BlogContent>
          {blogPosts.map((post) => (
            <BlogCard key={post.id}>
              <BlogImage src={post.image} alt={post.title} />
              <BlogCardCenter>
                <BlogCardTitle>{post.title}</BlogCardTitle>
                <ArrowIcon>
                  <ArrowTopIcon color="rgba(0, 0, 0, 1)" />
                </ArrowIcon>
              </BlogCardCenter>
              <BlogCardDate>{post.date}</BlogCardDate>
            </BlogCard>
          ))}
        </BlogContent>
      </BlogContainer>
      <Footer />
    </div>
  );
}

export default Blog;
