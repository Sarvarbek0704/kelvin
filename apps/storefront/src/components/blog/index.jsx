import React from "react";
import catalogIcon from "../../assets/catalog-icon.png";
import blog1 from "../../assets/blog1.png";
import blog2 from "../../assets/blog2.png";
import blog3 from "../../assets/blog3.png";
import { ArrowTop } from "../icons";
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
} from "./Blog.styled";

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
    <BlogContainer>
      <BlogHeader>
        <BlogTitle>Блог</BlogTitle>
        <BlogButton>
          Перейти в блог <img src={catalogIcon} alt="catalogIcon" />
        </BlogButton>
      </BlogHeader>
      <BlogContent>
        {blogPosts.map((post) => (
          <BlogCard key={post.id}>
            <BlogImage src={post.image} alt={post.title} />
            <BlogCardCenter>
              <BlogCardTitle>{post.title}</BlogCardTitle>
              <ArrowIcon>
                <ArrowTop color="rgba(0, 0, 0, 1)" />
              </ArrowIcon>
            </BlogCardCenter>
            <BlogCardDate>{post.date}</BlogCardDate>
          </BlogCard>
        ))}
      </BlogContent>
    </BlogContainer>
  );
}

export default Blog;
